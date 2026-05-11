/**
 * For every release with no listen-source URL (no Bandcamp, no YouTube,
 * no Spotify, etc.), search YouTube for "$primary-artist $title" and
 * save the top result's video URL to release.youtubeUrl.
 *
 * Reuses the same YouTube Data API the /api/radio-search endpoint uses.
 *
 * Run modes:
 *   npx tsx scripts/backfill-youtube-urls.ts           — backfill all orphans
 *   npx tsx scripts/backfill-youtube-urls.ts --dry     — preview only
 *   npx tsx scripts/backfill-youtube-urls.ts --limit 10 — first 10 only
 *
 * Idempotent: skips any release that already has a youtubeUrl set.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const KEY = process.env.YOUTUBE_API_KEY!;
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  if (i === -1) return Infinity;
  return parseInt(args[i + 1] ?? "10", 10) || 10;
})();

type Release = {
  _id: string;
  title: string;
  artists?: { name: string }[];
  bandcampUrl?: string;
  bandcampAlbumId?: string;
  bandcampTrackId?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  youtubePlaylistId?: string;
  soundcloudUrl?: string;
};

function searchQuery(r: Release): string {
  const artist = (r.artists ?? []).map((a) => a.name).join(" ").trim();
  if (/^various/i.test(artist) || !artist) return r.title;
  return `${artist} ${r.title}`;
}

async function searchYouTube(q: string): Promise<{ videoId: string; title: string; channel: string } | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", KEY);
  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`YouTube API quota exceeded or auth issue (403)`);
    }
    return null;
  }
  const data = (await res.json()) as { items?: any[] };
  const first = data.items?.[0];
  if (!first?.id?.videoId) return null;
  return {
    videoId: first.id.videoId,
    title: first.snippet?.title ?? "",
    channel: first.snippet?.channelTitle ?? "",
  };
}

(async () => {
  const orphans: Release[] = await sanity.fetch(`
    *[_type == "release" && (withdrawn != true)
      && !defined(bandcampUrl) && !defined(bandcampAlbumId) && !defined(bandcampTrackId)
      && !defined(spotifyUrl) && !defined(appleMusicUrl)
      && !defined(youtubeUrl) && !defined(youtubePlaylistId)
      && !defined(soundcloudUrl)
    ] | order(year desc, releaseDate desc) {
      _id, title, "artists": artists[]->{name}
    }
  `);

  console.log(`\n🎬 Backfilling YouTube URLs for ${orphans.length} orphan releases${DRY ? " (DRY RUN)" : ""}\n`);

  let filled = 0, missed = 0, processed = 0;
  for (const r of orphans) {
    if (processed >= LIMIT) break;
    processed++;
    const q = searchQuery(r);
    process.stdout.write(`   [${processed.toString().padStart(3)}/${Math.min(orphans.length, LIMIT)}]  ${q.slice(0, 60).padEnd(60)} → `);
    let hit: any = null;
    try {
      hit = await searchYouTube(q);
    } catch (e: any) {
      console.log(`ERR: ${e.message}`);
      break; // bail on quota — Nick can re-run later
    }
    if (!hit) {
      console.log("no match");
      missed++;
      continue;
    }
    const yt = `https://www.youtube.com/watch?v=${hit.videoId}`;
    console.log(`✓ ${hit.channel?.slice(0, 30) ?? ""}  → ${hit.videoId}`);
    if (!DRY) {
      await sanity.patch(r._id).set({ youtubeUrl: yt }).commit();
    }
    filled++;
  }

  console.log(`\n✅ done — ${filled} filled · ${missed} no-match · ${processed} processed${DRY ? " (DRY)" : ""}`);
  if (orphans.length > processed) console.log(`   (${orphans.length - processed} more orphans not yet processed)`);
})();
