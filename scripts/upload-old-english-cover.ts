/**
 * Upload the finalized Old English (DJ Spinn + Nick Hook Remix) cover
 * to Sanity and attach it to the release doc.
 *
 * The cover is the slime-green recolored 1L bottle artwork with the
 * canonical C+C white mark replacing the old Mass Appeal logo and the
 * "DJ SPINN + NICK HOOK REMIX" credit rotated on the left edge.
 *
 * Run: npx tsx scripts/upload-old-english-cover.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-old-english-spinn-hook-remix";
const COVER_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Nick Hook Ft. Inti, Pawkarmayta, Mikongo-Kusa/old-english-cover-slime-vip-3000.jpg";

async function main() {
  const buf = readFileSync(COVER_PATH);
  console.log(`→ uploading cover (${(buf.length / 1024).toFixed(0)} KB)`);
  const asset = await client.assets.upload("image", buf, {
    filename: "old-english-spinn-hook-remix-cover.jpg",
    contentType: "image/jpeg",
  });
  console.log(`→ asset _id: ${asset._id}`);

  await client
    .patch(RELEASE_ID)
    .set({
      cover: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
    })
    .commit();
  console.log(`→ patched ${RELEASE_ID}.cover`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
