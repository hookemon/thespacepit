import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const s = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production", apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
async function main() {
  const r = await s.fetch(`*[_id == "release-cc017-50-backwoods"][0]{title, bandcampUrl, bandcampAlbumId, bandcampTrackId, youtubeUrl, soundcloudUrl}`);
  console.log("50 backwoods:", r);
}
main().catch(console.error);
