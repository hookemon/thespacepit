import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Lee Scratch Perry / New Age Doom related
  const r = await c.fetch(`*[_type == "release" && (
    title match "*Scratch*" || title match "*Perry*" || title match "*Doom*" ||
    "lee-scratch-perry" in artists[]->slug.current || "new-age-doom" in artists[]->slug.current ||
    title match "*Remix*Universe*"
  )]{_id, title, "slug": slug.current, label, "artists": artists[]->name, bandcampUrl, youtubeUrl}`);
  console.log("Lee Scratch Perry / New Age Doom releases:");
  console.log(JSON.stringify(r, null, 2));
  console.log();
  // Releases that have Bandcamp but no YouTube — could benefit from a topic-channel fallback
  const bcOnly = await c.fetch(`count(*[_type == "release" && (withdrawn != true)
    && (defined(bandcampUrl) || defined(bandcampAlbumId) || defined(bandcampTrackId))
    && !defined(youtubeUrl)
  ])`);
  console.log(`releases with bandcamp but no YouTube: ${bcOnly}`);
})();
