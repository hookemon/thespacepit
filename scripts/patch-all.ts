/**
 * Bulk-populate as many releases as we can match cleanly:
 * for each, scrape Bandcamp for album ID + cover + tracklist, call Songlink
 * for cross-platform links, then patch Sanity. Releases not in this map stay
 * placeholder-only (fill via Studio later).
 *
 * Run: npx tsx scripts/patch-all.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";
const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

// Release ID → Bandcamp URL.  Hand-mapped from the calmcollect / nickhook /
// spiritualfriendship Bandcamps. Releases not in this list keep their
// placeholder cover until Nick fills them in via Studio.
const MAP: { id: string; url: string }[] = [
  { id: "release-cc002-like-water", url: "https://nickhook.bandcamp.com/album/like-water" },
  { id: "release-cc003-drums", url: "https://spiritualfriendship.bandcamp.com/album/drums" },
  { id: "release-cc004-peephole", url: "https://nickhook.bandcamp.com/album/peephole-ft-gangsta-boo" },
  { id: "release-cc007-im-fresh", url: "https://nickhook.bandcamp.com/track/im-fresh" },
  { id: "release-cc010-i-can-feel-it-ep", url: "https://nickhook.bandcamp.com/album/i-can-feel-it-ep" },
  { id: "release-cc012-collage-v-1", url: "https://nickhook.bandcamp.com/album/collage-v-1" },
  { id: "release-cc014-head", url: "https://nickhook.bandcamp.com/album/head-ft-21-savage-remixes" },
  { id: "release-cc015-relationships", url: "https://nickhook.bandcamp.com/album/relationships" },
  { id: "release-cc019-bluni", url: "https://nickhook.bandcamp.com/track/bluni-con-foryfive-y-lao" },
  { id: "release-cc020-the-crystal", url: "https://nickhook.bandcamp.com/track/nick-hook-lao-yoga-fire-the-crystal" },
  { id: "release-cc021-tardes-de-verano-polybiu-remix", url: "https://nickhook.bandcamp.com/album/tardes-de-verano-remixes" },
  { id: "release-cc023-iv", url: "https://spiritualfriendship.bandcamp.com/album/iv" },
  { id: "release-cc025-la-burbuja-lp", url: "https://nickhook.bandcamp.com/album/la-burbuja" },
  { id: "release-cc026-jungle-juice-v-1", url: "https://nickhook.bandcamp.com/album/jungle-juice-vol-1" },
  { id: "release-cc027-what-you-gonna-do", url: "https://nickhook.bandcamp.com/album/what-you-gonna-do" },
  { id: "release-ccinst001-relationships-instrumentals", url: "https://nickhook.bandcamp.com/album/relationships-instrumentals" },
  { id: "release-hookemon002-spiritual-friendship-s-t", url: "https://spiritualfriendship.bandcamp.com/album/spiritual-friendship" },
];

type ScrapeResult = {
  embedKind: "album" | "track";
  embedId: string;
  coverUrl: string | null;
  tracks: { num: number; title: string; duration: string }[];
};

async function scrapeBandcamp(url: string): Promise<ScrapeResult | null> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.warn(`   ⚠️  fetch ${url} → ${res.status}`);
    return null;
  }
  const html = await res.text();

  // Embed ID — Bandcamp pages contain album=NNNN or track=NNNN in their JSON
  const albumMatch = html.match(/album=(\d+)/);
  const trackMatch = html.match(/track=(\d+)/);
  let embedKind: "album" | "track";
  let embedId: string;
  if (albumMatch) {
    embedKind = "album";
    embedId = albumMatch[1];
  } else if (trackMatch) {
    embedKind = "track";
    embedId = trackMatch[1];
  } else {
    console.warn(`   ⚠️  no embed id found in ${url}`);
    return null;
  }

  // Cover — og:image meta tag
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
  const coverUrl = ogImage ? ogImage[1] : null;

  // Tracklist — pull from data-tralbum JSON if present
  const tracks: ScrapeResult["tracks"] = [];
  const tralbumMatch = html.match(/data-tralbum="([^"]+)"/);
  if (tralbumMatch) {
    try {
      const decoded = tralbumMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      const data = JSON.parse(decoded);
      if (Array.isArray(data?.trackinfo)) {
        for (const t of data.trackinfo) {
          const seconds = Math.round(t.duration ?? 0);
          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;
          tracks.push({
            num: t.track_num ?? tracks.length + 1,
            title: t.title ?? "Untitled",
            duration: `${min}:${String(sec).padStart(2, "0")}`,
          });
        }
      }
    } catch (err) {
      console.warn(`   ⚠️  tracklist parse failed for ${url}: ${(err as Error).message}`);
    }
  }

  return { embedKind, embedId, coverUrl, tracks };
}

type SonglinkResult = {
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  soundcloud?: string;
};

async function fetchSonglink(bandcampUrl: string): Promise<SonglinkResult> {
  const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(bandcampUrl)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.warn(`   ⚠️  songlink ${apiUrl.slice(0, 80)}... → ${res.status}`);
    return {};
  }
  const data = await res.json();
  type LinkRow = { url?: string };
  const platforms = data?.linksByPlatform ?? {};
  return {
    spotify: (platforms.spotify as LinkRow | undefined)?.url,
    appleMusic: (platforms.appleMusic as LinkRow | undefined)?.url,
    youtube: (platforms.youtubeMusic as LinkRow | undefined)?.url ?? (platforms.youtube as LinkRow | undefined)?.url,
    soundcloud: (platforms.soundcloud as LinkRow | undefined)?.url,
  };
}

async function uploadCover(coverUrl: string, filename: string) {
  const res = await fetch(coverUrl);
  if (!res.ok) throw new Error(`cover fetch ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, {
    filename,
    contentType: res.headers.get("content-type") ?? "image/jpeg",
  });
  return asset._id;
}

async function patchOne(entry: { id: string; url: string }, idx: number, total: number) {
  console.log(`\n[${idx + 1}/${total}] ${entry.id}`);
  console.log(`   url: ${entry.url}`);

  const scraped = await scrapeBandcamp(entry.url);
  if (!scraped) {
    console.log(`   ⏭  skip (no scrape data)`);
    return;
  }

  const songlink = await fetchSonglink(entry.url);

  let coverAssetId: string | null = null;
  if (scraped.coverUrl) {
    try {
      const filename = entry.id.replace(/^release-/, "") + ".jpg";
      coverAssetId = await uploadCover(scraped.coverUrl, filename);
      console.log(`   ✓ cover uploaded (${filename})`);
    } catch (err) {
      console.warn(`   ⚠️  cover upload failed: ${(err as Error).message}`);
    }
  }

  type SetFields = {
    bandcampUrl: string;
    bandcampAlbumId?: string;
    spotifyUrl?: string;
    appleMusicUrl?: string;
    youtubeUrl?: string;
    soundcloudUrl?: string;
    cover?: { _type: "image"; asset: { _type: "reference"; _ref: string } };
  };

  // The Bandcamp embed itself shows the tracklist with per-track play. We do
  // NOT mirror it into the credits[] field anymore — credits is reserved for
  // actual production credits (mixed by, mastered by, etc.) that Nick fills in
  // via Studio. The scraped track count just goes in the log line below.

  const setFields: SetFields = {
    bandcampUrl: entry.url,
  };
  if (scraped.embedKind === "album") setFields.bandcampAlbumId = scraped.embedId;
  if (songlink.spotify) setFields.spotifyUrl = songlink.spotify;
  if (songlink.appleMusic) setFields.appleMusicUrl = songlink.appleMusic;
  if (songlink.youtube) setFields.youtubeUrl = songlink.youtube;
  if (songlink.soundcloud) setFields.soundcloudUrl = songlink.soundcloud;
  if (coverAssetId) {
    setFields.cover = {
      _type: "image",
      asset: { _type: "reference", _ref: coverAssetId },
    };
  }

  // Clear any credits previously written by the old version of this script
  // (which used credits[] to mirror the tracklist).
  await client.patch(entry.id).set(setFields).unset(["credits"]).commit();
  const filledLinks = Object.entries(songlink).filter(([, v]) => v).map(([k]) => k);
  console.log(`   ✓ patched. embed=${scraped.embedKind}/${scraped.embedId} · ${scraped.tracks.length} tracks · links: bandcamp${filledLinks.length ? "+" + filledLinks.join("+") : ""}`);
}

async function main() {
  console.log(`\n🎛  Bulk-patching ${MAP.length} releases...\n`);
  for (let i = 0; i < MAP.length; i++) {
    try {
      await patchOne(MAP[i], i, MAP.length);
    } catch (err) {
      console.error(`   ❌ ${MAP[i].id} failed: ${(err as Error).message}`);
    }
  }
  console.log(`\n✅ Done. Reload /calm-collect to see real covers + players.`);
}

main();
