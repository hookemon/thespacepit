import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Any project doc for SF?
  const sf = await c.fetch(`*[_type == "project" && (name match "*piritual*" || slug.current match "*spiritual*")]{ _id, name, "slug": slug.current, kind, yearStart, yearEnd, "releases": releases[]->{title, releaseDate} }`);
  console.log("SF project docs:", JSON.stringify(sf, null, 2));
  // Every SF release in chronological order
  const rels = await c.fetch(`*[_type == "release" && "artist-spiritual-friendship" in artists[]._ref] | order(releaseDate asc, year asc) { _id, title, label, releaseDate, year, catalogNumber }`);
  console.log("\nAll SF releases (chronological):", JSON.stringify(rels, null, 2));
})();
