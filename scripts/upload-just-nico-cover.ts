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

const RELEASE_ID = "release-nick-hook-album-ii";
const COVER_PATH = "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/just-nico-cover-3000.jpg";

async function main() {
  const buf = readFileSync(COVER_PATH);
  const asset = await client.assets.upload("image", buf, {
    filename: "just-nico-cover.jpg",
    contentType: "image/jpeg",
  });
  await client
    .patch(RELEASE_ID)
    .set({
      cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      coverColor: "#F2B705",
    })
    .commit();
  console.log(`✓ Just Nico cover patched (${(buf.length / 1024).toFixed(0)} KB, asset ${asset._id})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
