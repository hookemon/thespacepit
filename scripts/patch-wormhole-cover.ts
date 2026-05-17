/* eslint-disable no-console */
/**
 * Grab the ROLLERCOASTER LP cover from iTunes (Cadence Weapon, 2024) and
 * patch it onto release-ext-wormhole. Wormhole is a single off ROLLERCOASTER
 * so the album cover is the canonical artwork.
 *
 * iTunes serves a 100x100 thumb by default; bumping the path to 1500x1500
 * gives us the high-res JPEG.
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

const RELEASE_ID = "release-ext-wormhole";
const COVER_THUMB =
  "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/00/53/73/00537337-f35a-5ddb-0879-b9aa35a20dc9/22156.jpg/100x100bb.jpg";
const COVER_HIRES = COVER_THUMB.replace("100x100bb.jpg", "1500x1500bb.jpg");

async function main() {
  console.log(`→ fetching ${COVER_HIRES}`);
  const res = await fetch(COVER_HIRES);
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`   ${buf.length} bytes`);

  console.log("→ uploading to Sanity assets…");
  const asset = await client.assets.upload("image", buf, {
    filename: "wormhole-rollercoaster-cover.jpg",
  });
  console.log(`   asset _id: ${asset._id}`);

  console.log(`→ patching ${RELEASE_ID}.cover`);
  await client
    .patch(RELEASE_ID)
    .set({
      cover: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
    })
    .commit();
  console.log("   ✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
