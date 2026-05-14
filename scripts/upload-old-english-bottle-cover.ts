/* eslint-disable no-console */
/**
 * Upload the slime-green VIP cover to Sanity and attach it to the Old
 * English release. Also updates the title from "Remix" → "VIP" to match
 * the new artwork credit.
 *
 * Source: recolor-old-english-cover.ts output (Dropbox path below).
 *
 * Run: npx tsx scripts/upload-old-english-bottle-cover.ts
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

const RELEASE_ID = "release-old-english-spinn-hook-remix";
const COVER_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Nick Hook Ft. Inti, Pawkarmayta, Mikongo-Kusa/old-english-cover-slime-vip-3000.jpg";

async function main() {
  const buf = readFileSync(COVER_PATH);
  console.log(`→ uploading cover (${(buf.length / 1024).toFixed(0)} KB)`);
  const asset = await client.assets.upload("image", buf, {
    filename: "old-english-slime-vip-3000.jpg",
    contentType: "image/jpeg",
  });
  console.log(`→ asset _id: ${asset._id}`);

  await client
    .patch(RELEASE_ID)
    .set({
      cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      coverColor: "#7AFB0D",
      title: "Old English (DJ Spinn + Nick Hook + Scatta VIP)",
    })
    .commit();
  console.log("✓ Old English: slime VIP cover + title updated to VIP");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
