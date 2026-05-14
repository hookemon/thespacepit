/* eslint-disable no-console */
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

async function main() {
  const doc = await client.fetch(
    `*[_id == $id][0]{
      _id, title, "slug": slug.current, status,
      youtubeUrl, mainVideoUrl, videos,
      bandcampAlbumId,
      tagline, linerNotes
    }`,
    { id: "release-old-english-spinn-hook-remix" },
  );
  console.log(JSON.stringify(doc, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
