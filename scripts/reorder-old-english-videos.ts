/* eslint-disable no-console */
/**
 * Reorder the Old English videos[] so the WATCH playlist leads with the
 * Noisey "Rap Monument: Young Thug" verse — context for the original beat
 * that doesn't duplicate the hero music video already playing up top.
 *
 * Order after this runs:
 *   1. Noisey · The Rap Monument: Young Thug (verse over the beat)
 *   2. Mass Appeal audio (2014)
 *   3. Spinn × Nick Hook × Scatta — footwork VIP
 *
 * The Ruffmercy official video stays in mainVideoUrl/youtubeUrl as the
 * page hero; it's filtered out of the WATCH playlist by the page renderer.
 *
 * Run: npx tsx scripts/reorder-old-english-videos.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-old-english-spinn-hook-remix";

// Noisey's The Rap Monument — Young Thug verse over the Old English beat.
// Per Laurel footage brief, this is the canonical clip of YT performing
// on the original beat in a non-music-video setting.
const RAP_MONUMENT_YT = "https://www.youtube.com/watch?v=8PtAjCbo0L8";

const AUDIO_UPLOAD = "https://www.youtube.com/watch?v=jEsuiDfR02I";
const FOOTWORK_FLIP =
  "https://soundcloud.com/dj-spinn-1/old-english-spinnnick-hookscatta-vip";

async function main() {
  const videos = [
    {
      _type: "object",
      _key: "vid-rap-monument-yt",
      title: "Noisey · The Rap Monument — Young Thug verse",
      youtubeUrl: RAP_MONUMENT_YT,
    },
    {
      _type: "object",
      _key: "vid-audio-2014",
      title: "Mass Appeal audio (2014)",
      youtubeUrl: AUDIO_UPLOAD,
    },
    {
      _type: "object",
      _key: "vid-footwork-vip",
      title: "Spinn × Nick Hook × Scatta — footwork VIP",
      youtubeUrl: FOOTWORK_FLIP,
    },
  ];

  await client.patch(RELEASE_ID).set({ videos }).commit();
  console.log("✓ Old English: videos[] reordered — Rap Monument YT first");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
