/**
 * Add two Cubic Zirconia remix releases that were missing from the catalog:
 *
 *   1. Pantero 666 — "X Lova (Cubic Zirconia Remix)"  (2011)
 *      youtube: 9o5HMK61AII
 *
 *   2. Egyptrixx — "The Only Way Up (Cubic Zirconia Remix)" (Night Slugs, NS002, 2010)
 *      youtube: d_k87mnElj0
 *
 * Both follow the existing "Off The Wall (Cubic Zirconia Remix)" precedent:
 *   - Release artist = original artist
 *   - Cubic Zirconia in `credits[]` with role="Remix"
 *   - Single-track tracklist
 *   - Label = "Other" (non-CC catalog)
 *   - Status = "out"
 *   - Cover = YouTube thumbnail (replaceable in /studio)
 *
 * Idempotent — deterministic doc IDs, skips if already exists.
 *
 * Usage: npx tsx scripts/add-cz-remixes.ts
 *        then: npx tsx scripts/fetch-platform-urls.ts --slug=x-lova-cubic-zirconia-remix
 *              npx tsx scripts/fetch-platform-urls.ts --slug=the-only-way-up-cubic-zirconia-remix
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const k = () => randomBytes(6).toString("hex");

type Remix = {
  artistId: string;
  artistName: string;
  artistSlug: string;
  releaseId: string;
  releaseSlug: string;
  title: string;             // release/track title
  catalogNumber: string | null;
  releaseDate: string;       // YYYY-MM-DD
  year: number;
  parentEpNote: string;      // free-text note (goes in track artists string)
  youtubeId: string;
};

const REMIXES: Remix[] = [
  {
    artistId: "artist-pantero-666",
    artistName: "Pantero 666",
    artistSlug: "pantero-666",
    releaseId: "release-ext-x-lova-cz-remix",
    releaseSlug: "x-lova-cubic-zirconia-remix",
    title: "X Lova (Cubic Zirconia Remix)",
    catalogNumber: null,
    releaseDate: "2011-01-01",
    year: 2011,
    parentEpNote: "Pantero 666 (Cubic Zirconia Remix)",
    youtubeId: "9o5HMK61AII",
  },
  {
    artistId: "artist-egyptrixx",
    artistName: "Egyptrixx",
    artistSlug: "egyptrixx",
    releaseId: "release-ext-the-only-way-up-cz-remix",
    releaseSlug: "the-only-way-up-cubic-zirconia-remix",
    title: "The Only Way Up (Cubic Zirconia Remix)",
    catalogNumber: "NS002",      // Night Slugs catalog number for the parent EP
    releaseDate: "2010-01-01",
    year: 2010,
    parentEpNote: "Egyptrixx (Cubic Zirconia Remix) · from The Only Way Up EP · Night Slugs NS002",
    youtubeId: "d_k87mnElj0",
  },
];

async function ensureArtist(r: Remix) {
  const existing = await sanity.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{_id}`, { id: r.artistId }
  );
  if (existing) {
    console.log(`  · artist exists: ${r.artistName}`);
    return;
  }
  await sanity.createOrReplace({
    _id: r.artistId,
    _type: "artist",
    name: r.artistName,
    slug: { _type: "slug", current: r.artistSlug },
  } as any);
  console.log(`  ✓ created artist: ${r.artistName} (${r.artistSlug})`);
}

async function uploadCover(r: Remix) {
  const url = `https://i.ytimg.com/vi/${r.youtubeId}/maxresdefault.jpg`;
  let res = await fetch(url);
  // YouTube returns 404 for older videos without maxres — fall back to hq
  if (!res.ok) {
    res = await fetch(`https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg`);
  }
  if (!res.ok) throw new Error(`cover fetch failed for ${r.youtubeId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await sanity.assets.upload("image", buf, {
    filename: `${r.releaseSlug}-cover.jpg`,
    source: { name: "add-cz-remixes", id: r.youtubeId, url },
  });
  console.log(`  ✓ uploaded cover (${(buf.length / 1024).toFixed(1)}kb) → ${asset._id}`);
  return asset._id;
}

async function createRelease(r: Remix, coverAssetId: string) {
  const existing = await sanity.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{_id}`, { id: r.releaseId }
  );
  if (existing) {
    console.log(`  · release exists: ${r.title}`);
    return;
  }
  await sanity.createOrReplace({
    _id: r.releaseId,
    _type: "release",
    title: r.title,
    slug: { _type: "slug", current: r.releaseSlug },
    artists: [{ _type: "reference", _ref: r.artistId, _key: k() }],
    catalogNumber: r.catalogNumber,
    releaseDate: r.releaseDate,
    year: r.year,
    label: "Other",
    status: "out",
    cover: { _type: "image", asset: { _type: "reference", _ref: coverAssetId } },
    credits: [
      {
        _key: k(),
        _type: "object",
        person: { _type: "reference", _ref: "artist-cubic-zirconia" },
        role: "Remix",
      },
    ],
    tracklist: [
      {
        _key: k(),
        _type: "track",
        title: r.title,
        artists: r.parentEpNote,
      },
    ],
  } as any);
  console.log(`  ✓ created release: ${r.title}`);
}

async function fetchYTDetails(yid: string) {
  const KEY = process.env.YOUTUBE_API_KEY!;
  const u = new URL("https://www.googleapis.com/youtube/v3/videos");
  u.searchParams.set("part", "snippet,contentDetails,statistics");
  u.searchParams.set("id", yid);
  u.searchParams.set("key", KEY);
  const r = await fetch(u);
  const d = await r.json() as any;
  return d.items?.[0];
}

function fmtDur(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0"), min = parseInt(m[2] || "0"), s = parseInt(m[3] || "0");
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${min}:${String(s).padStart(2, "0")}`;
}

async function createVideoDoc(r: Remix) {
  const docId = `video-${r.youtubeId}`;
  const existing = await sanity.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{_id}`, { id: docId }
  );
  const det = await fetchYTDetails(r.youtubeId);
  if (!det) { console.log(`  ✗ youtube returned nothing for ${r.youtubeId}`); return; }

  const set: Record<string, any> = {
    youtubeId: r.youtubeId,
    title: det.snippet.title,
    publishedAt: det.snippet.publishedAt,
    thumbnailUrl: det.snippet.thumbnails?.maxres?.url ?? det.snippet.thumbnails?.high?.url,
    duration: fmtDur(det.contentDetails.duration),
    viewCount: parseInt(det.statistics.viewCount ?? "0", 10),
    tags: ["cubic-zirconia", "music-video"],
    relatedRelease: { _type: "reference", _ref: r.releaseId },
  };

  if (existing) {
    await sanity.patch(docId).set(set).commit();
    console.log(`  ↻ updated video: ${r.youtubeId}`);
  } else {
    const doc: any = { _id: docId, _type: "video", ...set };
    if (det.snippet.description) doc.description = det.snippet.description.slice(0, 5000);
    await sanity.createOrReplace(doc);
    console.log(`  + created video: ${r.youtubeId}`);
  }
}

(async () => {
  console.log("\n💎 Adding Cubic Zirconia remix releases to catalog\n");
  for (const r of REMIXES) {
    console.log(`\n── ${r.artistName} — ${r.title} ──`);
    await ensureArtist(r);
    const coverId = await uploadCover(r);
    await createRelease(r, coverId);
    await createVideoDoc(r);
  }
  console.log("\n  next: run `npx tsx scripts/fetch-platform-urls.ts --slug=x-lova-cubic-zirconia-remix` and same for the-only-way-up-cubic-zirconia-remix to autofill DSPs\n");
})();
