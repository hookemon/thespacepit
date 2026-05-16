/**
 * Upload QOQEQA's portrait + flesh out his artist doc.
 *
 * Source: square-cropped portrait from Crack Magazine 2021 (their "Rising"
 * profile of him). QOQEQA = Daniel Valle Riestra, Lima-based, Peruvian
 * Afro-electronic, ex-Animal Chuki, debut LP AxuxA on Dengue Dengue
 * Dengue's Kebrada label.
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

const ARTIST_ID = "artist-qoqeqa";
const PORTRAIT_PATH = "/tmp/qoqeqa-square.jpg";

async function main() {
  const buf = readFileSync(PORTRAIT_PATH);
  console.log(`→ uploading portrait (${(buf.length / 1024).toFixed(0)} KB)`);
  const asset = await client.assets.upload("image", buf, {
    filename: "qoqeqa-portrait.jpg",
    contentType: "image/jpeg",
  });

  await client
    .patch(ARTIST_ID)
    .set({
      portrait: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
      city: "Lima",
      tagline:
        "Daniel Valle Riestra. Afro-Peruvian electronic. Ex-Animal Chuki. AxuxA on Kebrada (2021). Hyper-merengue remix of 'If The Glove Don't Fit' (2026).",
      instagramUrl: "https://www.instagram.com/qoqeqaqoqeqa/",
      bandcampUrl: "https://qoqeqa.bandcamp.com/",
    })
    .commit();
  console.log(`✓ ${ARTIST_ID} updated with portrait + bio`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
