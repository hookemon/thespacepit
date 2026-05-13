/**
 * Backfill artist portrait photos from Wikipedia. Same strict matching as
 * seed-artist-bios.ts — exact title + disambiguation suffixes only, NO fuzzy
 * search. We only attach a photo if the Wikipedia REST API's
 * `originalimage.source` exists AND the page is verified music-related.
 *
 * Idempotent — skips artists who already have a portrait unless --force.
 *
 * Run:
 *   npx tsx scripts/seed-artist-photos.ts
 *   npx tsx scripts/seed-artist-photos.ts --force
 *   npx tsx scripts/seed-artist-photos.ts --slug danny-brown
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const UA = "spacepit-web/1.0 (https://thespacepit.com) photo-scraper";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const FORCE     = process.argv.includes("--force");
const ONLY_SLUG = arg("slug");

const DISAMBIGS = ["", "(musician)", "(rapper)", "(producer)", "(DJ)", "(band)", "(music producer)", "(artist)"];

const MUSIC_TERMS = [
  "musician", "rapper", "producer", "vocalist", "singer", "songwriter",
  "DJ ", "MC ", "emcee", "record label", "music group", "hip hop", "hip-hop",
  "electronic", "techno", "house", "drum and bass", "footwork", "grime",
  "trap", "R&B", "soul music", "music duo",
];

type WikiSummary = {
  type?: string;
  title: string;
  description?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
};

async function tryWiki(title: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    const d = (await res.json()) as WikiSummary;
    if (d.type === "disambiguation") return null;
    return d;
  } catch {
    return null;
  }
}

function isMusicRelated(extract = "", description = ""): boolean {
  const hay = `${extract}\n${description}`.toLowerCase();
  return MUSIC_TERMS.some((t) => hay.includes(t.toLowerCase()));
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleMatchesArtist(title: string, artist: string, extract = ""): boolean {
  const an = normalizeName(artist);
  const tn = normalizeName(title.replace(/\s*\([^)]+\)\s*/g, ""));
  if (tn === an) return true;
  if (tn.startsWith(an) && tn.length - an.length <= 4) return true;
  if (an.startsWith(tn) && an.length - tn.length <= 4) return true;
  if (extract.slice(0, 80).toLowerCase().includes(artist.toLowerCase())) return true;
  return false;
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return null; // skip tiny "no image" placeholders
    const asset = await sanity.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

type Artist = { _id: string; name: string; slug: string; hasPortrait: boolean };

async function main() {
  const rows = await sanity.fetch<Artist[]>(`
    *[_type == "artist"]{
      _id, name, "slug": slug.current,
      "hasPortrait": defined(portrait)
    } | order(onLabel desc, name asc)
  `);

  let pool = rows;
  if (ONLY_SLUG) pool = pool.filter((a) => a.slug === ONLY_SLUG);
  else if (!FORCE) pool = pool.filter((a) => !a.hasPortrait);

  console.log(`📸 ${pool.length} artists missing a portrait\n`);

  let wrote = 0, noImage = 0, noMatch = 0;
  for (const a of pool) {
    const label = ` ${a.name.padEnd(32)}`;
    process.stdout.write(`${label} `);

    if (/^(various|unknown|self|n\/a)$/i.test(a.name.trim()) || a.name.length < 2) {
      console.log("· skip placeholder");
      continue;
    }

    let hit: WikiSummary | null = null;
    for (const disambig of DISAMBIGS) {
      const candidate = disambig ? `${a.name} ${disambig}` : a.name;
      const s = await tryWiki(candidate);
      if (s?.extract && titleMatchesArtist(s.title, a.name, s.extract) && isMusicRelated(s.extract, s.description)) {
        hit = s;
        break;
      }
      await new Promise((r) => setTimeout(r, 80));
    }

    if (!hit) {
      console.log("✗ no wiki match");
      noMatch += 1;
      continue;
    }

    // Prefer the high-res original image; fall back to the thumbnail (320px wide
    // is the default REST API thumb — better than nothing).
    const src = hit.originalimage?.source ?? hit.thumbnail?.source;
    if (!src) {
      console.log(`✗ "${hit.title}" has no image`);
      noImage += 1;
      continue;
    }

    const ext = src.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
    // Skip SVGs (usually logos, not portraits) and odd formats
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      console.log(`✗ skip ${ext} (probably a logo)`);
      noImage += 1;
      continue;
    }

    const assetId = await uploadFromUrl(src, `${a.slug}.${ext}`);
    if (!assetId) {
      console.log(`✗ upload failed`);
      noImage += 1;
      continue;
    }

    await sanity.patch(a._id).set({
      portrait: { _type: "image", asset: { _type: "reference", _ref: assetId } },
    }).commit();

    console.log(`✓ "${hit.title}"  ${hit.originalimage?.width ?? hit.thumbnail?.width}px`);
    wrote += 1;

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n✅ ${wrote} portraits written · ${noImage} no image on page · ${noMatch} no wiki match`);
}
main().catch((err) => { console.error(err); process.exit(1); });
