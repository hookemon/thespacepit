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

const RELEASE_ID = "release-cc-compilation-2026";
const COVER_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/cc-compilation-cover-3000.jpg";

async function main() {
  const buf = readFileSync(COVER_PATH);
  const asset = await client.assets.upload("image", buf, {
    filename: "cc-compilation-cover.jpg",
    contentType: "image/jpeg",
  });
  await client
    .patch(RELEASE_ID)
    .set({
      cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      // Paper-cream coverColor — the zine ground bleeds nicely into the
      // release page background.
      coverColor: "#F4EFE6",
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}.cover patched (${(buf.length / 1024).toFixed(0)} KB, asset ${asset._id})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
