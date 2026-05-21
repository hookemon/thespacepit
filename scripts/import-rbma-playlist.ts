/**
 * RBMA era import — driven by the canonical playlist on Nick's channel.
 *
 * Playlist: "RBMA 2011 MADRID" — PLMXEKDUSbulMWfiS_Q_QCoD0wat66M29b
 *   (Nick's own curation. 18 videos as of 2026-05-18. RBMA lectures from
 *    his Madrid class + 2 of his own tracks from the era.)
 *
 * Updates the existing era doc `project-red-bull-rbma`:
 *   - Imports all videos in the playlist (idempotent on youtubeId)
 *   - Sets `relatedEra` on each
 *   - Pins Nick's own RBMA 2011 footage (`DfVv6EaEDJA`) as featured
 *   - Cleans up any video docs previously linked to this era that are
 *     NOT in the playlist (so reruns are authoritative — what's in the
 *     playlist is what's on the page)
 *   - Patches era doc: yearStart=2011, youtubeUrl=playlist URL
 *
 * Usage: npx tsx scripts/import-rbma-playlist.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const PLAYLIST_ID = "PLMXEKDUSbulMWfiS_Q_QCoD0wat66M29b";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const ERA_DOC_ID = "project-red-bull-rbma";

// Nick's own RBMA 2011 footage on his channel — pinned as the era anchor.
const NICK_RBMA_VIDEO_ID = "DfVv6EaEDJA";
const FEATURED_VIDEO_IDS = new Set<string>([NICK_RBMA_VIDEO_ID]);

const KEY = process.env.YOUTUBE_API_KEY!;
if (!KEY) {
  console.error("❌ YOUTUBE_API_KEY must be set in .env.local");
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const TAG_RULES: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "interview", pattern: /\b(interview|talks to|in conversation|sat down|q\s?&\s?a|talking|lecture)\b/i },
  { tag: "live-set",  pattern: /\b(live (?:at|in|from)?|dj set|set at|festival|sónar|sonar|movement|boiler room|nts|the lot)\b/i },
  { tag: "behind-the-scenes", pattern: /\b(bts|behind the scenes|making of|in the studio|studio session)\b/i },
];

function autoTags(title: string, description = ""): string[] {
  const text = `${title}\n${description}`;
  const tags = new Set<string>(["rbma"]);
  for (const { tag, pattern } of TAG_RULES) if (pattern.test(text)) tags.add(tag);
  return [...tags];
}

type PlaylistItem = {
  contentDetails: { videoId: string; videoPublishedAt?: string };
  snippet: { title: string; description: string; thumbnails?: any; position?: number };
};
type VideoDetails = {
  id: string;
  snippet: { title: string; description: string; publishedAt: string; thumbnails?: any };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
  status?: { privacyStatus?: string };
};

function pickThumb(t: any) {
  if (!t) return null;
  return t.maxres?.url ?? t.high?.url ?? t.medium?.url ?? t.default?.url ?? null;
}
function formatDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0"), min = parseInt(m[2] || "0"), s = parseInt(m[3] || "0");
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${min}:${String(s).padStart(2, "0")}`;
}

async function fetchAllPlaylistItems(): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;
  while (true) {
    const u = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    u.searchParams.set("part", "contentDetails,snippet");
    u.searchParams.set("playlistId", PLAYLIST_ID);
    u.searchParams.set("maxResults", "50");
    u.searchParams.set("key", KEY);
    if (pageToken) u.searchParams.set("pageToken", pageToken);
    const r = await fetch(u);
    if (!r.ok) throw new Error(`playlistItems failed: ${r.status}`);
    const d = (await r.json()) as { items: PlaylistItem[]; nextPageToken?: string };
    items.push(...d.items);
    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }
  return items;
}

async function fetchVideoDetails(ids: string[]): Promise<VideoDetails[]> {
  const out: VideoDetails[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const slice = ids.slice(i, i + 50);
    const u = new URL("https://www.googleapis.com/youtube/v3/videos");
    u.searchParams.set("part", "snippet,contentDetails,statistics,status");
    u.searchParams.set("id", slice.join(","));
    u.searchParams.set("key", KEY);
    const r = await fetch(u);
    if (!r.ok) throw new Error(`videos failed: ${r.status}`);
    const d = (await r.json()) as { items: VideoDetails[] };
    out.push(...d.items);
  }
  return out;
}

(async () => {
  console.log("\n🎓 RBMA 2011 MADRID → Sanity\n");

  const era = await sanity.fetch<{ _id: string; name: string } | null>(
    `*[_id == $id][0]{_id, name}`, { id: ERA_DOC_ID }
  );
  if (!era) { console.error("❌ era doc missing"); process.exit(1); }
  console.log(`  era: ${era.name} (${era._id})\n`);

  console.log("→ fetching playlist items...");
  const items = await fetchAllPlaylistItems();
  // Dedupe (YouTube API returns occasional dupes for re-ordered playlists)
  const ids = [...new Set(items.map((i) => i.contentDetails.videoId))];
  console.log(`  ✓ ${ids.length} unique video IDs in playlist`);

  const details = await fetchVideoDetails(ids);
  console.log(`  ✓ ${details.length} detail records resolved\n`);

  const existing = await sanity.fetch<{ _id: string; youtubeId: string; tags?: string[]; description?: string }[]>(
    `*[_type == "video" && youtubeId in $ids]{_id, youtubeId, tags, description}`, { ids }
  );
  const existingByYid = new Map(existing.map((d) => [d.youtubeId, d]));
  console.log(`  (${existingByYid.size} already in Sanity — preserving manual edits)\n`);

  let created = 0, updated = 0, skipped = 0;
  const importedDocIds = new Set<string>();

  for (const v of details) {
    const yid = v.id;
    if (v.status?.privacyStatus && v.status.privacyStatus !== "public") {
      console.log(`  ⚠ skip ${yid} — privacyStatus=${v.status.privacyStatus} (${v.snippet.title.slice(0, 60)})`);
      skipped++;
      continue;
    }
    const docId = `video-${yid}`;
    importedDocIds.add(docId);
    const prior = existingByYid.get(yid);
    const auto = autoTags(v.snippet.title, v.snippet.description);
    const mergedTags = prior ? [...new Set([...(prior.tags ?? []), ...auto])] : auto;

    const doc: Record<string, any> = {
      _id: docId,
      _type: "video",
      youtubeId: yid,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnailUrl: pickThumb(v.snippet.thumbnails),
      duration: formatDuration(v.contentDetails.duration),
      viewCount: parseInt(v.statistics.viewCount ?? "0", 10),
      tags: mergedTags,
      relatedEra: { _type: "reference", _ref: ERA_DOC_ID },
      featured: FEATURED_VIDEO_IDS.has(yid),
    };
    if (!prior && v.snippet.description) doc.description = v.snippet.description.slice(0, 5000);

    if (prior) {
      await sanity.patch(docId).set({
        title: doc.title, publishedAt: doc.publishedAt, thumbnailUrl: doc.thumbnailUrl,
        duration: doc.duration, viewCount: doc.viewCount, tags: doc.tags,
        relatedEra: doc.relatedEra, featured: doc.featured,
      }).commit();
      updated++;
    } else {
      await sanity.createOrReplace(doc as any);
      created++;
    }
  }
  console.log(`\n  ✓ created ${created}, updated ${updated}, skipped ${skipped}`);

  // CLEANUP: any video doc currently linked to this era that's NOT in
  // the playlist gets either deleted (if it was created by an earlier
  // run of this script) or unlinked (if it has other significance).
  console.log("\n→ cleaning up videos linked to this era that aren't in the playlist...");
  const linked = await sanity.fetch<{ _id: string; youtubeId: string; title: string; _createdAt: string }[]>(
    `*[_type == "video" && relatedEra._ref == $era && !(_id in $keep)]{_id, youtubeId, title, _createdAt}`,
    { era: ERA_DOC_ID, keep: [...importedDocIds] }
  );
  if (linked.length === 0) {
    console.log("  (none to clean up)");
  } else {
    for (const v of linked) {
      // Heuristic: if it was created in the last week AND we're authoritative on this era,
      // delete the doc outright. Otherwise unlink (set relatedEra = null) to preserve it.
      const created = new Date(v._createdAt).getTime();
      const oneWeekAgo = Date.now() - 7 * 86400 * 1000;
      if (created > oneWeekAgo) {
        await sanity.delete(v._id);
        console.log(`  🗑  deleted: ${v.youtubeId} · ${v.title.slice(0, 60)}`);
      } else {
        await sanity.patch(v._id).unset(["relatedEra"]).commit();
        console.log(`  ↩ unlinked from era: ${v.youtubeId} · ${v.title.slice(0, 60)}`);
      }
    }
  }

  console.log("\n→ patching era doc...");
  await sanity.patch(ERA_DOC_ID).set({
    youtubeUrl: PLAYLIST_URL, yearStart: 2011,
  }).commit();
  console.log("  ✓ era doc updated");

  const final = await sanity.fetch<number>(
    `count(*[_type == "video" && relatedEra._ref == $id])`, { id: ERA_DOC_ID }
  );
  console.log(`\n  videos now linked to era: ${final}`);
  console.log(`  view: http://localhost:3000/eras/red-bull-rbma\n`);
})();
