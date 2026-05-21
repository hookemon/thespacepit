/**
 * Wire the D'CALLE music video onto the Yoga Fire — LAZARO release.
 * Sets tracklist[D'CALLE].videoUrl. Idempotent.
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

const RELEASE_ID = "release-ext-lazaro";
const TRACK_TITLE = "D'CALLE";
const VIDEO_URL = "https://www.youtube.com/watch?v=09fJuOO5s6A";

async function main() {
  const release = await client.fetch<{
    _id: string;
    title: string;
    tracklist: { _key?: string; title: string; videoUrl?: string | null }[];
  }>(`*[_id == $id][0]{ _id, title, tracklist[]{ _key, title, videoUrl } }`, { id: RELEASE_ID });

  if (!release) throw new Error(`Release ${RELEASE_ID} not found`);

  const trackIdx = release.tracklist.findIndex(t => t.title === TRACK_TITLE);
  if (trackIdx < 0) throw new Error(`Track "${TRACK_TITLE}" not found on ${release.title}`);

  const current = release.tracklist[trackIdx];
  if (current.videoUrl === VIDEO_URL) {
    console.log(`✓ Already set — videoUrl on "${TRACK_TITLE}" matches. No-op.`);
    return;
  }

  const trackKey = current._key;
  if (!trackKey) throw new Error(`Track "${TRACK_TITLE}" has no _key, cannot patch in place`);

  const result = await client
    .patch(RELEASE_ID)
    .set({ [`tracklist[_key=="${trackKey}"].videoUrl`]: VIDEO_URL })
    .commit();

  console.log(`✓ Patched ${release.title} → ${TRACK_TITLE} videoUrl = ${VIDEO_URL}`);
  console.log(`  rev: ${result._rev}`);
}

main().catch(e => { console.error(e); process.exit(1); });
