/**
 * Fetch cover art from the iTunes Search API for any release that doesn't
 * have a cover uploaded yet. Targets the external production credits first
 * (label == "Other") but works on any release.
 *
 * iTunes returns 100x100 artwork URLs — we swap to 1200x1200 by URL pattern.
 *
 * Idempotent — skips releases that already have a cover. Pass --force to
 * overwrite. Pass --slug=X to target one. Pass --all to include C+C releases.
 *
 * Run:
 *   npx tsx scripts/fetch-itunes-covers.ts                 # externals only, missing covers
 *   npx tsx scripts/fetch-itunes-covers.ts --slug=run-the-jewels-4-2020
 *   npx tsx scripts/fetch-itunes-covers.ts --all           # include C+C releases
 *   npx tsx scripts/fetch-itunes-covers.ts --force         # overwrite existing
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ALL_LABELS = args.includes("--all");
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

type ReleaseRow = {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  label?: string;
  artistNames: string[];
  hasCover: boolean;
};

type ITunesResult = {
  collectionName?: string;
  trackName?: string;
  artistName?: string;
  releaseDate?: string;
  artworkUrl100?: string;
  collectionType?: string;
  wrapperType?: string;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, "") // strip "(feat. X)", "(Remix)", etc
    .replace(/feat\.?.*$/i, "")
    .replace(/\b(ep|lp|single|album|instrumentals?|deluxe|edition|remastered|reissue)\b/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// First-artist-only helper for multi-artist credit strings like
// "Young Thug, A$AP Ferg, Freddie Gibbs" → "Young Thug".
function primaryArtist(s: string): string {
  return s
    .split(/\s*[×]\s*|\s*,\s*|\s*\/\s*|\s+(?:and|with|feat\.?|featuring|ft\.?)\s+/i)[0]
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((t) => t.length >= 2));
}

function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

function bigArtworkUrl(url: string): string {
  // Replace 100x100bb in the path with 1200x1200bb for high-res.
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, "/1200x1200bb.$2");
}

async function searchITunesEntity(
  artist: string,
  title: string,
  entity: "album" | "song"
): Promise<ITunesResult | null> {
  const cleanTitle = normalize(title);
  const cleanArtist = normalize(primaryArtist(artist));
  const term = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());
  if (!term) return null;
  const url = `https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=15`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { results: ITunesResult[] };
    const results = data.results ?? [];

    let best: { score: number; r: ITunesResult } | null = null;
    for (const r of results) {
      const collName = r.collectionName ?? "";
      const aSim = similarity(r.artistName ?? "", artist);
      const tSim = similarity(collName, title);
      // Require BOTH a meaningful title match AND a meaningful artist match
      // to avoid the "Old English by Shempington's Place" trap.
      if (tSim < 0.4) continue;
      if (aSim < 0.3) continue;
      const score = tSim * 0.6 + aSim * 0.4;
      if (!best || score > best.score) best = { score, r };
    }
    return best?.r ?? null;
  } catch (err) {
    console.warn("  ⚠ itunes error:", (err as Error).message);
    return null;
  }
}

async function searchITunes(artist: string, title: string): Promise<ITunesResult | null> {
  // Try album first (usually best quality art); fall back to song match for
  // singles that don't have a standalone album record.
  return (
    (await searchITunesEntity(artist, title, "album")) ??
    (await searchITunesEntity(artist, title, "song"))
  );
}

async function uploadCoverFromUrl(
  url: string,
  releaseId: string,
  releaseTitle: string
): Promise<boolean> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠ image fetch ${res.status}: ${url}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const filename = `${releaseTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-cover.jpg`;
  const asset = await client.assets.upload("image", buf, { filename });
  await client.patch(releaseId).set({ cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } } }).commit();
  return true;
}

async function main() {
  const labelFilter = ALL_LABELS ? "" : `&& label == "Other"`;
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const coverFilter = FORCE ? "" : "&& !defined(cover)";

  const rows = await client.fetch<ReleaseRow[]>(`
    *[_type == "release" && (withdrawn != true) ${labelFilter} ${slugFilter} ${coverFilter}]
      | order(year desc) {
      _id,
      title,
      "slug": slug.current,
      year,
      label,
      "artistNames": artists[]->name,
      "hasCover": defined(cover)
    }
  `);

  if (rows.length === 0) {
    console.log("Nothing to do — every release matching the filter already has a cover.");
    return;
  }

  console.log(`🎨 Fetching covers for ${rows.length} release${rows.length === 1 ? "" : "s"}...\n`);

  let okCount = 0;
  let skipCount = 0;
  for (const r of rows) {
    const artist = (r.artistNames ?? [])[0] ?? "";
    const label = `${r.title}`.padEnd(34, " ").slice(0, 34);
    process.stdout.write(`  ${label} `);

    const hit = await searchITunes(artist, r.title);
    if (!hit?.artworkUrl100) {
      console.log("✗ no match");
      skipCount += 1;
      await new Promise((res) => setTimeout(res, 250));
      continue;
    }

    const bigUrl = bigArtworkUrl(hit.artworkUrl100);
    const ok = await uploadCoverFromUrl(bigUrl, r._id, r.title);
    if (ok) {
      console.log(`✓ ${(hit.artistName ?? "").slice(0, 20).padEnd(20)}  ${(hit.collectionName ?? "").slice(0, 32)}`);
      okCount += 1;
    } else {
      console.log("✗ upload failed");
      skipCount += 1;
    }

    // Be polite to iTunes — 4 req/sec is well under any rate limit.
    await new Promise((res) => setTimeout(res, 250));
  }

  console.log(`\n✅ ${okCount} covers uploaded · ${skipCount} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
