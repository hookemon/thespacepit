/**
 * Patch the LDCC001–006 Cubic Zirconia releases.
 * Pulls tracklist + cover + Bandcamp embed ID from cubiczirconia.bandcamp.com
 * for the ones available there. Logs what's missing for the rest.
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

// Catalog # → Bandcamp URL on cubiczirconia.bandcamp.com (where available)
const MAP: { catNum: string; releaseId: string; bandcampUrl?: string }[] = [
  { catNum: "LDCC001", releaseId: "release-ldcc001-josephine", bandcampUrl: "https://cubiczirconia.bandcamp.com/album/josephine" },
  { catNum: "LDCC002", releaseId: "release-ldcc002-black-blue", bandcampUrl: "https://cubiczirconia.bandcamp.com/track/black-blue-f-spoek-matumbo" },
  { catNum: "LDCC003", releaseId: "release-ldcc003-hoes-come-out-at-night" },
  { catNum: "LDCC004", releaseId: "release-ldcc004-follow-your-heart" },
  { catNum: "LDCC005", releaseId: "release-ldcc005-take-me-high" },
  { catNum: "LDCC006", releaseId: "release-ldcc006-darko" },
];

async function scrapeBandcamp(url: string) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) return null;
  const html = await res.text();
  const albumMatch = html.match(/album=(\d+)/);
  const trackMatch = html.match(/track=(\d+)/);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);

  return {
    albumId: albumMatch?.[1],
    trackId: trackMatch?.[1],
    coverUrl: ogImage?.[1],
  };
}

async function uploadCover(coverUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, { filename, contentType: "image/jpeg" });
    return asset._id;
  } catch (err) {
    console.warn(`     ⚠️  cover upload failed: ${(err as Error).message}`);
    return null;
  }
}

(async () => {
  console.log("\n💎 Patching Cubic Zirconia releases (LDCC001–006)\n");
  for (const e of MAP) {
    console.log(`\n${e.catNum}`);
    if (!e.bandcampUrl) {
      console.log(`   ⏭  no Bandcamp URL on cubiczirconia.bandcamp.com — try discogs / spotify, or fill in /studio`);
      continue;
    }
    console.log(`   url: ${e.bandcampUrl}`);
    const data = await scrapeBandcamp(e.bandcampUrl);
    if (!data) {
      console.log("   ❌ scrape failed");
      continue;
    }
    type Patch = {
      bandcampUrl: string;
      bandcampAlbumId?: string;
      bandcampTrackId?: string;
      cover?: { _type: "image"; asset: { _type: "reference"; _ref: string } };
    };
    const patch: Patch = { bandcampUrl: e.bandcampUrl };
    if (data.albumId) patch.bandcampAlbumId = data.albumId;
    if (data.trackId) patch.bandcampTrackId = data.trackId;
    if (data.coverUrl) {
      const filename = e.releaseId + ".jpg";
      const assetId = await uploadCover(data.coverUrl, filename);
      if (assetId) patch.cover = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    }
    await client.patch(e.releaseId).set(patch).commit();
    console.log(`   ✓ patched. embed=${data.albumId ? `album/${data.albumId}` : data.trackId ? `track/${data.trackId}` : "—"}, cover=${data.coverUrl ? "✓" : "—"}`);
  }
  console.log("\n✅ done\n");
})();
