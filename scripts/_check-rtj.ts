import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_type == "release" && (title match "*Run The Jewels*" || title match "*RTJ*" || title match "*Meow*" || "run-the-jewels" in artists[]->slug.current || "el-p" in artists[]->slug.current)] | order(releaseDate asc) {
    _id, title, "slug": slug.current, label, year, releaseDate, "artists": artists[]->name, "trackCount": count(tracklist)
  }`);
  console.log(`Found ${r.length} RTJ-related releases:\n`);
  for (const x of r) {
    console.log(`  [${x.releaseDate || x.year || '?'}]  ${x.title.padEnd(35)}  artists=${x.artists.join('+')}  tracks=${x.trackCount}`);
  }
})();
