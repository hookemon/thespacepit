/**
 * Pull every video from the channel's uploads playlist into Sanity as `video`
 * docs. Idempotent (keys on youtubeId). Auto-tags titles using keyword
 * patterns; tags you set manually in /studio survive re-runs (we only OVERWRITE
 * tags on first creation; on update we MERGE — auto-tags additive, manual
 * tags preserved).
 *
 * Usage:  npx tsx scripts/sync-youtube.ts        — sync all
 *         npx tsx scripts/sync-youtube.ts 50     — sync first 50 only
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const KEY = process.env.YOUTUBE_API_KEY!;
const PLAYLIST = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID!;

if (!KEY || !PLAYLIST) {
  console.error("❌ YOUTUBE_API_KEY and YOUTUBE_UPLOADS_PLAYLIST_ID must be set");
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const MAX = parseInt(process.argv[2] ?? "0", 10) || Infinity;

// ── Auto-tag patterns. Order matters: first match wins for the primary,
//    but ALL matches that fire add a tag (so a video can be both "live-set"
//    and "spacepit").
const TAG_RULES: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "chakra",               pattern: /\b(chakra|root|sacral|solar plexus|heart|throat|third eye|crown|meditation|drone|spiritual friendship)\b/i },
  { tag: "spiritual-friendship", pattern: /\b(spiritual friendship|gareth jones|drums (?:1|2|i+)?)\b/i },
  { tag: "rtj",                  pattern: /\b(run the jewels|rtj|killer mike|el-?p|cu4tro)\b/i },
  { tag: "mwc",                  pattern: /\b(men women|mwc|tarbox|fridmann)\b/i },
  { tag: "cubic-zirconia",       pattern: /\b(cubic zirconia|tiombe|fuck work|josephine|black ?& ?blue|hoes come|follow your heart|take me high|darko)\b/i },
  { tag: "tutorial",             pattern: /\b(tutorial|how to|walkthrough|breakdown|explained|guide)\b/i },
  { tag: "music-video",          pattern: /\b(official video|music video|\(official\)|\[official\]|video for|prod by)\b/i },
  { tag: "behind-the-scenes",    pattern: /\b(bts|behind the scenes|making of|in the studio with)\b/i },
  { tag: "interview",            pattern: /\b(interview|talks to|in conversation|sat down|q\s?&\s?a|talking)\b/i },
  { tag: "live-set",             pattern: /\b(live (?:at|in|from)?|dj set|set at|festival|sónar|sonar|movement|boiler room|nts|the lot)\b/i },
  // NOTE: split-livestreams.ts re-classifies long-form (>=30min) "live-set"
  // entries as `livestream` after sync. Keep that script in your loop.
  { tag: "studio-session",       pattern: /\b(studio session|jam session|in session|live in studio)\b/i },
  { tag: "jam",                  pattern: /\b(modular|patch|improv|jam|noodle|loop)\b/i },
  { tag: "gear-demo",            pattern: /\b(demo|review|first look|unboxing|new gear|sidekick|move|op-?1|op1|808|prophet|octatrack|moog|ableton|teenage engineering|mpc|sp-?\d|tr-?\d|808|909|drum machine|sampler|synth)\b/i },
  { tag: "mix",                  pattern: /\b(mixtape|radio|episode \d+|nts mix|the lot mix|guest mix)\b/i },
  { tag: "vlog",                 pattern: /\b(vlog|day in the life|tour diary|on tour|on the road)\b/i },
  { tag: "medellin",             pattern: /\b(medell[ií]n|la burbuja|colombia|garden)\b/i },
  { tag: "spacepit",             pattern: /\b(thespacepit|spacepit|the pit|brooklyn studio)\b/i },
  { tag: "sample-pack",          pattern: /\b(sample pack|drum pack|loops? pack|free pack|pack drop)\b/i },
];

function autoTags(title: string, description = ""): string[] {
  const text = `${title}\n${description}`;
  const tags = new Set<string>();
  for (const { tag, pattern } of TAG_RULES) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

type PlaylistItem = {
  contentDetails: { videoId: string; videoPublishedAt?: string };
  snippet: { title: string; description: string; thumbnails?: any };
};

type VideoDetails = {
  id: string;
  snippet: { title: string; description: string; publishedAt: string; thumbnails?: any };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
};

function pickThumb(thumbnails: any): string | null {
  if (!thumbnails) return null;
  return thumbnails.maxres?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? null;
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const s = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

async function fetchAllPlaylistItems(): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;
  while (true) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("playlistId", PLAYLIST);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`playlistItems failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as { items: PlaylistItem[]; nextPageToken?: string };
    items.push(...data.items);
    if (items.length >= MAX) break;
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return items.slice(0, MAX);
}

async function fetchVideoDetails(ids: string[]): Promise<VideoDetails[]> {
  const out: VideoDetails[] = [];
  // YouTube allows up to 50 IDs per call
  for (let i = 0; i < ids.length; i += 50) {
    const slice = ids.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", slice.join(","));
    url.searchParams.set("key", KEY);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`videos failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as { items: VideoDetails[] };
    out.push(...data.items);
  }
  return out;
}

(async () => {
  console.log("\n📺 Syncing YouTube channel → Sanity\n");

  console.log("→ fetching playlist items (pages of 50)...");
  const playlistItems = await fetchAllPlaylistItems();
  console.log(`   ✓ ${playlistItems.length} videos in playlist`);

  const ids = playlistItems.map((i) => i.contentDetails.videoId);
  console.log(`\n→ fetching video details (in chunks of 50)...`);
  const details = await fetchVideoDetails(ids);
  console.log(`   ✓ ${details.length} video detail records`);

  // Pre-fetch any existing video docs so we know which to merge tags on.
  const existingDocs = await sanity.fetch<{ _id: string; youtubeId: string; tags?: string[] }[]>(
    `*[_type == "video"]{_id, youtubeId, tags}`
  );
  const existingByYid = new Map(existingDocs.map(d => [d.youtubeId, d]));
  console.log(`   (${existingByYid.size} existing video docs in Sanity)\n`);

  let created = 0, updated = 0;
  for (const v of details) {
    const yid = v.id;
    const docId = `video-${yid}`;
    const existing = existingByYid.get(yid);

    const auto = autoTags(v.snippet.title, v.snippet.description);
    // On update: keep manual tags + add new auto-tags. On create: just use auto.
    const mergedTags = existing
      ? [...new Set([...(existing.tags ?? []), ...auto])]
      : auto;

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
    };
    // Only set description on creation, so manual edits in /studio don't get overwritten.
    if (!existing && v.snippet.description) {
      doc.description = v.snippet.description.slice(0, 5000);
    }

    if (existing) {
      await sanity.patch(docId).set({
        title: doc.title,
        publishedAt: doc.publishedAt,
        thumbnailUrl: doc.thumbnailUrl,
        duration: doc.duration,
        viewCount: doc.viewCount,
        tags: doc.tags,
      }).commit();
      updated++;
    } else {
      await sanity.createOrReplace(doc as any);
      created++;
    }
  }

  console.log(`✅ done — ${created} created · ${updated} updated\n`);

  // Summary by tag
  const tagCounts: Record<string, number> = {};
  for (const v of details) {
    for (const t of autoTags(v.snippet.title, v.snippet.description)) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  console.log("auto-tag distribution:");
  for (const [tag, n] of sorted) console.log(`  ${n.toString().padStart(4)}  ${tag}`);
})();
