/**
 * Upload the finalized "If The Glove Don't Fit" cover to Sanity and
 * attach it to release-nick-hook-boo-pawmps-glove.
 *
 * Run: npx tsx scripts/upload-glove-cover.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-nick-hook-boo-pawmps-glove";
const COVER_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/glove-cover-3000.jpg";

async function main() {
  const buf = readFileSync(COVER_PATH);
  console.log(`→ uploading cover (${(buf.length / 1024).toFixed(0)} KB)`);
  const asset = await client.assets.upload("image", buf, {
    filename: "if-the-glove-dont-fit-cover.jpg",
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
      // Boo purple as the release coverColor so press/playlist accents
      // pick it up automatically across the site.
      coverColor: "#A87BFF",
    })
    .commit();
  console.log(`→ patched ${RELEASE_ID}.cover + coverColor`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
