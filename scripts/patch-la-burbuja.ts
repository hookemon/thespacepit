/**
 * One-off: fully populate La Burbuja LP (CC025) as the prototype release page —
 * real cover art, real Bandcamp embed, real liner-note tracklist.
 *
 * Run: npx tsx scripts/patch-la-burbuja.ts
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

const RELEASE_ID = "release-cc025-la-burbuja-lp";
const BANDCAMP_URL = "https://nickhook.bandcamp.com/album/la-burbuja";
const BANDCAMP_ALBUM_ID = "1689345862";
const COVER_URL = "https://f4.bcbits.com/img/a3938471402_10.jpg";

const TRACKLIST = [
  ["1", "Live From La Burbuja", "0:34"],
  ["2", "Pranayamaya Kosha", "2:29"],
  ["3", "Skateboard P", "1:47"],
  ["4", "Space Jam Tunnel", "3:06"],
  ["5", "Wilbert Interlude", "2:33"],
  ["6", "Kali Intro", "2:44"],
  ["7", "Kaligeance", "2:15"],
  ["8", "Wilbert Interlude 2", "2:02"],
  ["9", "Lokah", "4:45"],
  ["10", "Radio Interlude 2", "0:28"],
  ["11", "Be With It", "2:39"],
  ["12", "Ohm Shanti", "10:29"],
  ["13", "Terminal 22", "1:56"],
  ["14", "Moonroom", "3:29"],
  ["15", "Baby", "1:34"],
  ["16", "Spaghetti Showdown", "1:30"],
  ["17", "So Ham", "2:38"],
  ["18", "Praise The Lord (Terminal 22 Remix)", "1:56"],
] as const;

async function main() {
  console.log(`📥 Downloading cover from Bandcamp...`);
  const imgRes = await fetch(COVER_URL);
  if (!imgRes.ok) throw new Error(`Cover download failed: ${imgRes.status}`);
  const arrayBuf = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  console.log(`📤 Uploading cover to Sanity...`);
  const asset = await client.assets.upload("image", buffer, {
    filename: "la-burbuja-cover.jpg",
    contentType: "image/jpeg",
  });
  console.log(`   asset _id: ${asset._id}`);

  console.log(`✏️  Patching release ${RELEASE_ID}...`);

  // Build credits as a tracklist (using existing credits field — role = track #, name = "Title — duration")
  const credits = TRACKLIST.map(([num, title, dur], i) => ({
    _key: `track-${i}`,
    _type: "object",
    role: `Track ${num}`,
    name: `${title} — ${dur}`,
  }));

  await client
    .patch(RELEASE_ID)
    .set({
      bandcampUrl: BANDCAMP_URL,
      bandcampAlbumId: BANDCAMP_ALBUM_ID,
      year: 2024,
      tagline: "the recording. the meditation. the burbuja. — quazzy + nick hook in medellín.",
      cover: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
      credits,
    })
    .commit();

  console.log(`\n✅ Done. Reload http://localhost:3000/releases/cc025-la-burbuja-lp`);
}

main().catch((err) => {
  console.error("❌ Patch failed:", err);
  process.exit(1);
});
