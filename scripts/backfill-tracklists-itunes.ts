/* eslint-disable no-console */
/**
 * Backfill the remaining tracklist gaps via the free iTunes Search API.
 *
 * Strategy:
 *   1. Find every release with no tracklist
 *   2. Search iTunes for "<title> <primary artist>"
 *   3. If we get a collection result, fetch tracks via the lookup endpoint
 *   4. Patch the tracklist[]
 *
 * The iTunes Search API is unauthenticated, no rate limit posted but
 * conservative — we throttle 1s between calls.
 *
 * Run: npx tsx scripts/backfill-tracklists-itunes.ts
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

type ITunesResult = {
  wrapperType: "track" | "collection" | "audiobook" | "artist";
  kind?: string;
  collectionId?: number;
  trackId?: number;
  artistName?: string;
  collectionName?: string;
  trackName?: string;
  trackNumber?: number;
  trackTimeMillis?: number;
};

async function searchCollection(title: string, artist: string): Promise<number | null> {
  const term = `${title} ${artist}`;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data: { results: ITunesResult[] } = await res.json();
  // Pick best match — first one that contains the title word in collectionName.
  const lowerTitle = title.toLowerCase();
  const hit =
    data.results.find((r) =>
      (r.collectionName ?? "").toLowerCase().includes(lowerTitle),
    ) ?? data.results[0];
  return hit?.collectionId ?? null;
}

async function lookupTracks(collectionId: number): Promise<{ name: string; ms?: number; pos?: number }[]> {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: { results: ITunesResult[] } = await res.json();
  return data.results
    .filter((r) => r.wrapperType === "track" && r.kind === "song" && r.trackName)
    .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
    .map((r) => ({ name: r.trackName!, ms: r.trackTimeMillis, pos: r.trackNumber }));
}

function msToDuration(ms?: number): string | undefined {
  if (!ms) return undefined;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function main() {
  const targets: Array<{ _id: string; title: string; slug: string; artistNames: string[] }> =
    await client.fetch(`
      *[_type == "release" && (!defined(tracklist) || count(tracklist) == 0) && withdrawn != true]{
        _id, title, "slug": slug.current, "artistNames": artists[]->name
      }
    `);

  console.log(`Found ${targets.length} releases needing a tracklist\n`);

  let patched = 0;
  for (const r of targets) {
    const primaryArtist = r.artistNames?.[0] ?? "";
    console.log(`${r.slug} — "${r.title}" by ${primaryArtist}`);

    const collId = await searchCollection(r.title, primaryArtist);
    await new Promise((rr) => setTimeout(rr, 1000));
    if (!collId) {
      console.log(`  → no iTunes match`);
      continue;
    }
    console.log(`  ↳ iTunes collection ${collId}`);

    const tracks = await lookupTracks(collId);
    await new Promise((rr) => setTimeout(rr, 1000));
    if (tracks.length === 0) {
      console.log(`  → no tracks returned`);
      continue;
    }

    const sanityTracks = tracks.map((t) => {
      const entry: Record<string, unknown> = {
        _key: randomUUID(),
        _type: "track",
        title: t.name,
      };
      const dur = msToDuration(t.ms);
      if (dur) entry.duration = dur;
      return entry;
    });

    await client.patch(r._id).set({ tracklist: sanityTracks }).commit();
    console.log(`  ✓ patched ${sanityTracks.length} tracks`);
    patched++;
  }
  console.log(`\nPatched ${patched}/${targets.length} releases.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
