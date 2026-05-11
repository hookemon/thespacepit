import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Artists
  const a = await c.fetch(`*[_type == "artist" && (name match "*Blaq*" || name match "*Blackstarr*")]{_id, name, "slug": slug.current}`);
  console.log("artists:", a);
  // Releases mentioning blaqstarr in tracklist or credits
  const r = await c.fetch(`*[_type == "release" && (
    title match "*Blaq*" || references(^._id where _type == "artist" && name match "*Blaq*") ||
    count(tracklist[title match "*Blaq*" || feature match "*Blaq*"]) > 0 ||
    count(credits[name match "*Blaq*"]) > 0
  )]{_id, title, "slug": slug.current, "features": tracklist[].feature, "trackTitles": tracklist[].title}`);
  console.log("\nreleases:", JSON.stringify(r, null, 2));
})();
