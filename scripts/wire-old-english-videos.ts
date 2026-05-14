/**
 * Wire the Old English release page with its full video catalog:
 *   · Ruffmercy's official Basquiat-influenced music video (Jan 2015)
 *   · Mass Appeal audio upload (jun 2014)
 *   · DJ Spinn / Nick Hook / Scatta footwork VIP (Teklife flip, SoundCloud)
 *
 * The official Ruffmercy video is the "main" hero video; the others go
 * into the videos[] grid that renders under "watch" on the release page.
 *
 * Run: npx tsx scripts/wire-old-english-videos.ts
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

// Ruffmercy directed, dropped Jan 12 2015. The animated Basquiat-vibes one.
const OFFICIAL_VIDEO = "https://www.youtube.com/watch?v=6OpdjbzTIhM";

// Mass Appeal's original audio-only upload from June 2014.
const AUDIO_UPLOAD = "https://www.youtube.com/watch?v=jEsuiDfR02I";

// The Teklife footwork flip — Spinn/Hook/Scatta VIP, hosted on Spinn's SC.
const FOOTWORK_FLIP =
  "https://soundcloud.com/dj-spinn-1/old-english-spinnnick-hookscatta-vip";

async function main() {
  const videos = [
    {
      _type: "object",
      _key: "vid-official-2015",
      title: "Official Video (dir. Ruffmercy, 2015)",
      youtubeUrl: OFFICIAL_VIDEO,
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

  await client
    .patch(RELEASE_ID)
    .set({
      mainVideoUrl: OFFICIAL_VIDEO,
      youtubeUrl: OFFICIAL_VIDEO,
      videos,
    })
    .commit();

  console.log("→ wired main video + 3-entry videos[] grid");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
