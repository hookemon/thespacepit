/**
 * Sync ANY YouTube playlist → Sanity video docs, with each video linked to
 * a target brand and/or gear doc. Idempotent: re-running merges fresh
 * metadata onto existing video docs (keyed by youtubeId) and only writes
 * relatedBrand/relatedGear if those aren't already set (so manual /studio
 * curation is preserved).
 *
 * Used to ingest playlists like Nick's K.O. II EP-133 demos so they
 * automatically surface on:
 *   · /partners/teenage-engineering  (via video.relatedBrand)
 *   · /gear/te-ep-133-ko-ii          (via video.relatedGear)
 *
 * Usage:
 *   npx tsx scripts/sync-playlist-to-brand-gear.ts \
 *     --playlist PLMXEKDUSbulNxuGQje2dOe3aQJVMW92dd \
 *     --brand teenage-engineering \
 *     --gear te-ep-133-ko-ii \
 *     --tag gear-demo
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const KEY = process.env.YOUTUBE_API_KEY;
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

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const PLAYLIST_ID = arg("playlist");
const BRAND_SLUG  = arg("brand");
const GEAR_SLUG   = arg("gear");
const FORCE_TAG   = arg("tag");

if (!PLAYLIST_ID) {
  console.error("❌ --playlist is required");
  process.exit(1);
}
if (!BRAND_SLUG && !GEAR_SLUG) {
  console.error("❌ at least one of --brand / --gear is required");
  process.exit(1);
}

type PlaylistItem = {
  contentDetails: { videoId: string; videoPublishedAt?: string };
  snippet: { title: string; description: string; thumbnails?: Record<string, { url: string }> };
};

type VideoDetails = {
  id: string;
  snippet: { title: string; description: string; publishedAt: string; thumbnails?: Record<string, { url: string }> };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
};

async function fetchAllPlaylistItems(): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", PLAYLIST_ID!);
    url.searchParams.set("key", KEY!);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`youtube playlistItems ${res.status}: ${await res.text()}`);
      process.exit(1);
    }
    const data = (await res.json()) as { items: PlaylistItem[]; nextPageToken?: string };
    items.push(...data.items);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

async function fetchVideoDetails(ids: string[]): Promise<VideoDetails[]> {
  const out: VideoDetails[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", KEY!);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`youtube videos ${res.status}`);
    const data = (await res.json()) as { items: VideoDetails[] };
    out.push(...data.items);
  }
  return out;
}

// "PT12M34S" → "12:34", "PT1H02M03S" → "1:02:03"
function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const sec = parseInt(m[3] ?? "0", 10);
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function pickThumb(thumbs?: Record<string, { url: string }>): string | undefined {
  return thumbs?.maxres?.url ?? thumbs?.standard?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url;
}

async function lookupRef(type: "brand" | "gear", slug: string): Promise<string | null> {
  return sanity.fetch<string | null>(
    `*[_type == $type && slug.current == $slug][0]._id`,
    { type, slug }
  );
}

async function main() {
  console.log(`\n📺 syncing playlist ${PLAYLIST_ID}\n`);

  const brandId = BRAND_SLUG ? await lookupRef("brand", BRAND_SLUG) : null;
  const gearId  = GEAR_SLUG  ? await lookupRef("gear",  GEAR_SLUG)  : null;
  if (BRAND_SLUG && !brandId) { console.error(`❌ brand "${BRAND_SLUG}" not found`); process.exit(1); }
  if (GEAR_SLUG  && !gearId)  { console.error(`❌ gear "${GEAR_SLUG}" not found`); process.exit(1); }
  console.log(`   → brand: ${BRAND_SLUG ?? "—"} ${brandId ?? ""}`);
  console.log(`   → gear:  ${GEAR_SLUG  ?? "—"} ${gearId  ?? ""}`);
  console.log(`   → tag:   ${FORCE_TAG  ?? "—"}\n`);

  const items = await fetchAllPlaylistItems();
  console.log(`   ${items.length} videos in playlist\n`);
  const details = await fetchVideoDetails(items.map((i) => i.contentDetails.videoId));

  const existing = await sanity.fetch<{ _id: string; youtubeId: string; tags?: string[]; relatedBrand?: { _ref: string }; relatedGear?: { _ref: string } }[]>(
    `*[_type == "video" && youtubeId in $ids]{_id, youtubeId, tags, relatedBrand, relatedGear}`,
    { ids: details.map((d) => d.id) }
  );
  const existingByYid = new Map(existing.map((d) => [d.youtubeId, d]));

  let created = 0, updated = 0, linked = 0;
  for (const v of details) {
    const docId = `video-${v.id}`;
    const ex = existingByYid.get(v.id);

    const fields: Record<string, unknown> = {
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnailUrl: pickThumb(v.snippet.thumbnails),
      duration: formatDuration(v.contentDetails.duration),
      viewCount: parseInt(v.statistics.viewCount ?? "0", 10),
    };

    // Add FORCE_TAG to the tags array if it isn't already there
    if (FORCE_TAG) {
      const merged = new Set(ex?.tags ?? []);
      merged.add(FORCE_TAG);
      fields.tags = [...merged];
    }

    // Only set relatedBrand/Gear if they're not already set — manual /studio
    // edits win over the sync.
    if (brandId && !ex?.relatedBrand) {
      fields.relatedBrand = { _type: "reference", _ref: brandId };
    }
    if (gearId && !ex?.relatedGear) {
      fields.relatedGear = { _type: "reference", _ref: gearId };
    }

    if (ex) {
      await sanity.patch(docId).set(fields).commit();
      if ((brandId && !ex.relatedBrand) || (gearId && !ex.relatedGear)) linked += 1;
      updated += 1;
    } else {
      await sanity.createOrReplace({
        _id: docId,
        _type: "video",
        youtubeId: v.id,
        description: v.snippet.description?.slice(0, 5000),
        ...fields,
      });
      created += 1;
    }
  }

  console.log(`✅ ${created} created · ${updated} updated · ${linked} got brand/gear links\n`);
  if (BRAND_SLUG) console.log(`→ open http://localhost:3000/partners/${BRAND_SLUG}`);
  if (GEAR_SLUG)  console.log(`→ open http://localhost:3000/gear/${GEAR_SLUG}`);
}
main().catch((err) => { console.error(err); process.exit(1); });
