import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Find Union EP, Drums 2, Young Thug remix-related releases
  const r = await c.fetch(`*[_type == "release" && (
    title match "*Union*" || title match "*Drums 2*" || title match "*Drums.2*" ||
    "young-thug" in artists[]->slug.current ||
    title match "*Old English*Remix*" || title match "*Thug*Remix*"
  )]{_id, title, "slug": slug.current, label, releaseDate, "artists": artists[]->name, withdrawn}`);
  console.log("Match candidates:");
  console.log(JSON.stringify(r, null, 2));

  // Also: any existing dam-funk artists
  const a = await c.fetch(`*[_type == "artist" && (name match "*Dam*Funk*" || name match "*DāM*FunK*" || slug.current match "*dam-funk*")]{_id, name, "slug": slug.current}`);
  console.log("\nDam-Funk artist docs:");
  console.log(JSON.stringify(a, null, 2));
})();
