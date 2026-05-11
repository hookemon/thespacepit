/**
 * Patch the 5 Calllm chakra releases that exist as tracks on the
 * Spiritual Friendship "Drones" Bandcamp album. Each release gets the same
 * Bandcamp URL but its own track-level embed (so playing it on the release
 * page only plays that specific chakra, not the whole album).
 *
 * Third Eye and Crown aren't on this Bandcamp release — they need their own
 * URLs from Nick.
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

const BANDCAMP_URL = "https://spiritualfriendship.bandcamp.com/album/drones";
const ALBUM_COVER_URL = "https://f4.bcbits.com/img/a1675102433_10.jpg";

// release id (in Sanity) → { trackId, label so far }
const CHAKRAS: { id: string; trackId: string; suffix?: string }[] = [
  { id: "release-clm003-root", trackId: "2703495857" },
  { id: "release-clm004-sacral", trackId: "571684275" },
  // Solar Plexus is split into 3 parts on Bandcamp; we link to part 1 by default.
  { id: "release-clm005-solar-plexus", trackId: "3852392858", suffix: "(pt 1)" },
  { id: "release-clm006-heart", trackId: "2202333892" },
  { id: "release-clm007-throat", trackId: "1909451923" },
];

async function uploadCover(): Promise<string> {
  const res = await fetch(ALBUM_COVER_URL);
  if (!res.ok) throw new Error(`cover fetch ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, {
    filename: "drones-album-cover.jpg",
    contentType: "image/jpeg",
  });
  return asset._id;
}

(async () => {
  console.log("📥 Uploading shared Drones album cover (Nick can override per-chakra later)...");
  const sharedCoverId = await uploadCover();
  console.log(`   asset _id: ${sharedCoverId}\n`);

  for (const c of CHAKRAS) {
    console.log(`Patching ${c.id} (track ${c.trackId})...`);
    await client
      .patch(c.id)
      .set({
        bandcampUrl: BANDCAMP_URL,
        bandcampTrackId: c.trackId,
        cover: {
          _type: "image",
          asset: { _type: "reference", _ref: sharedCoverId },
        },
        tagline: c.suffix
          ? `from the Drones album · ${c.suffix}. own cover art coming soon.`
          : "from the Drones album. own cover art coming soon.",
      })
      .unset(["credits", "bandcampAlbumId"])
      .commit();
  }

  console.log("\n✅ Done. CLM003-007 now play their specific track from the Drones album.");
  console.log("   CLM008 (Third Eye) + CLM009 (Crown) need their own Bandcamp URLs.");
})();
