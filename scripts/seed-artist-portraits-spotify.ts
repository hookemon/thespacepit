/**
 * Artist portraits via Spotify Web API — the canonical source for "great
 * ones of everyone". Spotify returns each artist's official promo photo
 * (the one their team uploads as their public face on the platform),
 * typically 640x640 or 1080x1080. Much better than Wikipedia (fan-uploaded,
 * often outdated) for music artists.
 *
 * Auth: Client Credentials flow — no user OAuth, just app credentials.
 * Requires SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in .env.local.
 * Get them from https://developer.spotify.com/dashboard (free, no plan).
 *
 * Flow per artist:
 *   1. Search Spotify by name → /v1/search?q={name}&type=artist&limit=5
 *   2. Pick the closest match (exact normalized name, else first result if
 *      the popularity is high enough to suggest THE artist).
 *   3. images[0] is the largest (~640px+ square JPG).
 *   4. Upload to Sanity, patch portrait field.
 *
 * Modes:
 *   --missing       only artists with no portrait (default)
 *   --replace-wiki  also re-source artists whose current portrait was auto-
 *                   sourced from Wikipedia (filename starts "portrait-{slug}")
 *   --all           overwrite every artist (incl. custom uploads — careful)
 *   --dry           preview, no writes
 *   --limit N       cap at first N
 *
 * Rate limit: Spotify's search API allows ~180 req/min for client-credentials
 * apps. We throttle to ~5 req/sec for safety. Full sweep of 178 artists in
 * ~1 minute.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("\n❌ Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local");
  console.error("   Get them at https://developer.spotify.com/dashboard → create app → Client ID + Client Secret");
  process.exit(1);
}

const DRY = process.argv.includes("--dry");
const ALL = process.argv.includes("--all");
const REPLACE_WIKI = process.argv.includes("--replace-wiki");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(process.argv[LIMIT_IDX + 1] ?? "0", 10) : 0;

const UA = "thespacepit-portrait-sourcer/1.0";

type Artist = { _id: string; name: string; slug: string; portraitFile?: string };

// ── Spotify Auth ────────────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify auth failed: ${res.status} ${text}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
  return cachedToken.token;
}

// ── Spotify Search ──────────────────────────────────────────────────
type SpotifyArtist = {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  followers: { total: number };
};

async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const token = await getSpotifyToken();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}`, "user-agent": UA } });
  if (res.status === 429) {
    // Rate limited — back off
    const retry = parseInt(res.headers.get("retry-after") ?? "5", 10);
    console.log(`   ⏸ rate limited, sleeping ${retry}s`);
    await new Promise((r) => setTimeout(r, retry * 1000 + 500));
    return searchArtist(name);
  }
  if (!res.ok) return null;
  const data = await res.json() as { artists: { items: SpotifyArtist[] } };
  const items = data.artists?.items ?? [];
  if (items.length === 0) return null;

  const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const target = norm(name);

  // Tier 1: exact normalized match — pick highest popularity tied to the name
  const exact = items.filter((a) => norm(a.name) === target);
  if (exact.length > 0) {
    exact.sort((a, b) => b.popularity - a.popularity);
    return exact[0];
  }
  // Tier 2: substring match (target contains result name or vice versa) —
  // pick highest popularity. Avoids picking a less famous artist when there's
  // a clearly bigger match.
  const sub = items.filter((a) => {
    const an = norm(a.name);
    return an.includes(target) || target.includes(an);
  });
  if (sub.length > 0) {
    sub.sort((a, b) => b.popularity - a.popularity);
    // Sanity check — popularity must be > 5 to suggest this is a real artist
    // (anyone with 0-5 is likely a no-name with a coincidentally similar
    // string).
    if (sub[0].popularity > 5) return sub[0];
  }
  return null;
}

async function uploadImage(imgUrl: string, filename: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(imgUrl, { headers: { "user-agent": UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 4096) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0].split("+")[0];
    const asset = await c.assets.upload("image", buf, { filename: `${filename}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Determine working set
  let filter = `*[_type == "artist" && defined(name)]`;
  if (!ALL) {
    if (REPLACE_WIKI) {
      filter = `*[_type == "artist" && (
        !defined(portrait)
        || portrait.asset->originalFilename match "portrait-*"
      )]`;
    } else {
      filter = `*[_type == "artist" && !defined(portrait)]`;
    }
  }
  const artists = await c.fetch<Artist[]>(`${filter} | order(name asc) {
    _id, name, "slug": slug.current,
    "portraitFile": portrait.asset->originalFilename
  }`);
  const work = LIMIT > 0 ? artists.slice(0, LIMIT) : artists;
  console.log(`\nSpotify portrait sweep — ${work.length} artists${DRY ? " (DRY)" : ""}\n`);

  let ok = 0, noMatch = 0, noImage = 0, badUpload = 0;
  for (let i = 0; i < work.length; i += 1) {
    const a = work[i];
    const lbl = `[${String(i + 1).padStart(3, "0")}/${work.length}] ${a.name.padEnd(28)}`;
    const spotify = await searchArtist(a.name);
    if (!spotify) {
      noMatch += 1;
      console.log(`✗ ${lbl}  — no Spotify match`);
      await sleep(220);
      continue;
    }
    const img = spotify.images[0]; // largest
    if (!img) {
      noImage += 1;
      console.log(`◌ ${lbl}  — "${spotify.name}" has no images on Spotify`);
      await sleep(220);
      continue;
    }
    if (DRY) {
      console.log(`✓ ${lbl}  would upload  "${spotify.name}" (${spotify.followers.total.toLocaleString()} followers, ${img.width}x${img.height})`);
      await sleep(220);
      continue;
    }
    const assetId = await uploadImage(img.url, `portrait-sp-${a.slug ?? a._id}`);
    if (!assetId) {
      badUpload += 1;
      console.log(`⚠ ${lbl}  — upload failed`);
      await sleep(220);
      continue;
    }
    try {
      await c.patch(a._id).set({ portrait: { _type: "image", asset: { _type: "reference", _ref: assetId } } }).commit();
      ok += 1;
      console.log(`✓ ${lbl}  → "${spotify.name}"  (${spotify.followers.total.toLocaleString()} followers, ${img.width}x${img.height})`);
    } catch {
      badUpload += 1;
      console.log(`⚠ ${lbl}  — patch failed`);
    }
    await sleep(220);
  }

  console.log(`\n done. uploaded=${ok}  noMatch=${noMatch}  noImage=${noImage}  badUpload=${badUpload}\n`);
})();
