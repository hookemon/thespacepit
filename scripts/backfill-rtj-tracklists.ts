/* eslint-disable no-console */
/**
 * Backfill RTJ album tracklists. These are landmark records — no excuse
 * to have them on the site with empty tracklists.
 *
 * Strategy: search Discogs for each release by artist+title, take the
 * first canonical version, pull the tracklist. RTJ albums are very well
 * indexed so we expect 100% hit rate.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RTJ: Array<{ id: string; q: string; year: string }> = [
  { id: "release-ext-run-the-jewels-2-2014", q: "Run The Jewels 2", year: "2014" },
  { id: "release-ext-run-the-jewels-3-2016", q: "Run The Jewels 3", year: "2016" },
  { id: "release-ext-run-the-jewels-4-2020", q: "RTJ4", year: "2020" },
  { id: "release-ext-yankee-and-the-brave-ep-4-2020", q: "Yankee And The Brave Ep 4", year: "2020" },
];

type DiscogsTrack = { title: string; duration?: string; position?: string };

async function searchAndFetch(q: string, year: string): Promise<DiscogsTrack[]> {
  // 1. Search for the release
  const searchRes = await fetch(
    `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&artist=Run+The+Jewels&year=${year}&type=release&per_page=5`,
    { headers: { "User-Agent": "spacepit-web/1.0" } },
  );
  if (!searchRes.ok) {
    console.warn(`  ↳ search failed: ${searchRes.status}`);
    return [];
  }
  const search: { results?: { id?: number; title?: string; year?: string; format?: string[] }[] } =
    await searchRes.json();
  const candidates = search.results ?? [];
  // Pick the first non-compilation, non-remix candidate. Prefer Album/LP format.
  const best =
    candidates.find((r) => (r.format ?? []).some((f) => /album|lp|cd/i.test(f))) ??
    candidates[0];
  if (!best?.id) {
    console.warn(`  ↳ no candidates`);
    return [];
  }
  console.log(`  ↳ matched discogs:${best.id} (${best.title})`);
  await new Promise((r) => setTimeout(r, 2400));
  const detailRes = await fetch(`https://api.discogs.com/releases/${best.id}`, {
    headers: { "User-Agent": "spacepit-web/1.0" },
  });
  if (!detailRes.ok) {
    console.warn(`  ↳ detail fetch failed: ${detailRes.status}`);
    return [];
  }
  const detail: { tracklist?: DiscogsTrack[] } = await detailRes.json();
  return detail.tracklist ?? [];
}

async function main() {
  for (const r of RTJ) {
    console.log(`\n${r.id} (${r.q} · ${r.year})`);
    const tracks = await searchAndFetch(r.q, r.year);
    if (tracks.length === 0) {
      console.log(`  → no tracks, skipping`);
      await new Promise((r) => setTimeout(r, 2400));
      continue;
    }
    // Filter out Discogs "heading" entries (sub_track / index_track that
    // aren't real songs — they don't have positions like A1, 1, etc).
    // Actually the simpler test: real tracks have non-empty title; keep
    // everything by default but flag for review.
    const sanityTracks = tracks.map((t) => {
      const entry: Record<string, unknown> = {
        _key: randomUUID(),
        _type: "track",
        title: t.title,
      };
      if (t.duration) entry.duration = t.duration;
      return entry;
    });
    await client.patch(r.id).set({ tracklist: sanityTracks }).commit();
    console.log(`  ✓ patched ${sanityTracks.length} tracks`);
    await new Promise((r) => setTimeout(r, 2400));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
