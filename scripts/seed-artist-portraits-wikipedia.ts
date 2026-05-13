/**
 * Auto-source artist portraits from Wikipedia.
 *
 * For every artist without a portrait, hits Wikipedia's REST summary API
 * with the artist's name. If the page exists, is about a musician (heuristic
 * check on description), and has a thumbnail, downloads the image and
 * uploads it to Sanity as the artist's portrait.
 *
 * Strict safety net — bails on:
 *   · disambiguation pages
 *   · descriptions that don't read like a music artist (sports, politics,
 *     authors, etc.)
 *   · thumbnails too small (< 80px in either dim)
 *
 * Idempotent — only acts on artists with no existing portrait. Use --dry
 * to scan + report without writing. --limit N for testing.
 *
 * Rate-limited at ~5 req/sec (Wikipedia is generous but it's polite).
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

const DRY = process.argv.includes("--dry");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(process.argv[LIMIT_IDX + 1] ?? "0", 10) : 0;

const UA = "thespacepit-portrait-sourcer/1.0 (https://thespacepit.com; contact thespacepit@gmail.com)";

// Loose heuristic — description must imply "music person" or we skip.
// Anything mentioning rapper / producer / DJ / musician / band / songwriter
// / vocalist / singer / record label / electronic / hip hop / techno passes.
const MUSIC_HINT = /\b(rapper|producer|musician|composer|dj|disc.?jockey|band|songwriter|vocalist|singer|record(s|ing)?\s*label|electronic|hip[\s-]?hop|techno|house|drum|grime|trap|indie|rock|jazz|soul|funk|r&b|gospel|drummer|guitarist|bassist|keyboardist|saxophonist|trumpeter|pianist|orchestra|ensemble)\b/i;

type Artist = { _id: string; name: string; slug: string };

async function fetchWikipediaSummary(name: string): Promise<{
  type?: string;
  title?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
} | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s/g, "_"))}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function uploadImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(imageUrl, { headers: { "user-agent": UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 2048) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0].split("+")[0];
    const asset = await c.assets.upload("image", buf, { filename: `${filename}.${ext}`, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const artists = await c.fetch<Artist[]>(
    `*[_type == "artist" && !defined(portrait) && defined(name)] | order(name asc) {
      _id, name, "slug": slug.current
    }`
  );
  const work = LIMIT > 0 ? artists.slice(0, LIMIT) : artists;
  console.log(`\nscanning ${work.length} portrait-less artists${DRY ? " (DRY)" : ""}\n`);

  let uploaded = 0, noPage = 0, disambig = 0, notMusic = 0, noImage = 0, badUpload = 0;
  for (let i = 0; i < work.length; i += 1) {
    const a = work[i];
    const summary = await fetchWikipediaSummary(a.name);
    await sleep(200);
    const lblPrefix = `[${String(i + 1).padStart(3, "0")}/${work.length}] ${a.name.padEnd(28)}`;

    if (!summary) { noPage += 1; console.log(`✗ ${lblPrefix}  — no wikipedia page`); continue; }
    if (summary.type === "disambiguation") { disambig += 1; console.log(`◌ ${lblPrefix}  — disambiguation page (skipped)`); continue; }

    const desc = `${summary.description ?? ""} ${summary.extract ?? ""}`;
    if (!MUSIC_HINT.test(desc)) {
      notMusic += 1;
      console.log(`◌ ${lblPrefix}  — non-music page: "${(summary.description ?? "").slice(0, 60)}"`);
      continue;
    }

    const img = summary.originalimage ?? summary.thumbnail;
    if (!img || img.width < 80 || img.height < 80) {
      noImage += 1;
      console.log(`✗ ${lblPrefix}  — no usable image`);
      continue;
    }

    if (DRY) {
      console.log(`✓ ${lblPrefix}  would upload  ${img.source.slice(0, 70)}  · "${(summary.description ?? "").slice(0, 50)}"`);
      continue;
    }

    const assetId = await uploadImage(img.source, `portrait-${a.slug ?? a._id}`);
    if (!assetId) {
      badUpload += 1;
      console.log(`⚠ ${lblPrefix}  — upload failed`);
      continue;
    }
    try {
      await c.patch(a._id).set({ portrait: { _type: "image", asset: { _type: "reference", _ref: assetId } } }).commit();
      uploaded += 1;
      console.log(`✓ ${lblPrefix}  uploaded  · "${(summary.description ?? "").slice(0, 50)}"`);
    } catch {
      badUpload += 1;
      console.log(`⚠ ${lblPrefix}  — patch failed`);
    }
  }

  console.log(`\n done. uploaded=${uploaded}  noPage=${noPage}  disambig=${disambig}  notMusic=${notMusic}  noImage=${noImage}  badUpload=${badUpload}`);
})();
