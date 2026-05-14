/**
 * Wire the Old English YouTube playlist into the release doc so the
 * VideoPlaylist component pulls every clip Nick curated into the player.
 *
 * Run: npx tsx scripts/set-old-english-playlist.ts
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
const PLAYLIST_ID = "PLMXEKDUSbulMztUPXbrg3IUgbIIznwbEU";

async function main() {
  await client.patch(RELEASE_ID).set({ youtubePlaylistId: PLAYLIST_ID }).commit();
  console.log(`→ set youtubePlaylistId = ${PLAYLIST_ID} on ${RELEASE_ID}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
