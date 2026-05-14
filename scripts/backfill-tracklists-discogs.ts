/* eslint-disable no-console */
/**
 * Backfill tracklists from Discogs for any release whose Sanity _id is
 * of the form `release-discogs-<discogs-id>` and whose tracklist[] is
 * currently empty.
 *
 * Discogs has a free anonymous API (rate-limit ~25 req/min) — we hit
 * /releases/<id> and pull the tracklist + duration per track.
 *
 * Run: npx tsx scripts/backfill-tracklists-discogs.ts
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

type DiscogsTrack = { title: string; duration?: string; position?: string };

async function discogsFetch(discogsId: string): Promise<DiscogsTrack[]> {
  const res = await fetch(`https://api.discogs.com/releases/${discogsId}`, {
    headers: {
      "User-Agent": "spacepit-web/1.0 (catalog backfill)",
    },
  });
  if (!res.ok) {
    console.warn(`  ↳ discogs ${discogsId} → HTTP ${res.status}`);
    return [];
  }
  const data: { tracklist?: DiscogsTrack[] } = await res.json();
  return data.tracklist ?? [];
}

async function main() {
  const targets: Array<{ _id: string; title: string; slug: string }> =
    await client.fetch(`
      *[_type == "release" && _id match "release-discogs-*" && (!defined(tracklist) || count(tracklist) == 0) && withdrawn != true]{
        _id, title, "slug": slug.current
      }
    `);

  console.log(`Found ${targets.length} discogs-IDed releases with empty tracklist`);

  let patched = 0;
  for (const r of targets) {
    const discogsId = r._id.replace(/^release-discogs-/, "");
    console.log(`\n${r.slug} (discogs:${discogsId})`);
    const tracks = await discogsFetch(discogsId);
    if (tracks.length === 0) {
      console.log(`  → no tracks returned, skipping`);
      // ~25 req/min limit, throttle anyway
      await new Promise((r) => setTimeout(r, 2400));
      continue;
    }
    const sanityTracks = tracks.map((t) => {
      const entry: Record<string, unknown> = {
        _key: randomUUID(),
        _type: "track",
        title: t.title,
      };
      if (t.duration) entry.duration = t.duration;
      return entry;
    });
    await client.patch(r._id).set({ tracklist: sanityTracks }).commit();
    console.log(`  ✓ patched ${sanityTracks.length} tracks`);
    patched++;
    // Respect Discogs rate limit (~25/min = ~2.4s between calls)
    await new Promise((r) => setTimeout(r, 2400));
  }
  console.log(`\nPatched ${patched}/${targets.length} releases.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
