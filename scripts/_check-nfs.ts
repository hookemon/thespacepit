import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
(async () => {
  const r = await c.fetch(
    `*[_type == "release" && (title match "*peed*" || title match "*4 Speed*" || title match "*For Speed*")] {
      _id, title, "slug": slug.current, catalogNumber, label, year, releaseDate,
      "trackCount": count(tracklist),
      "creditCount": count(credits),
      "artistNames": artists[]->name
    }`
  );
  console.log(`Found ${r.length} matches:\n`);
  for (const x of r) {
    console.log(JSON.stringify(x, null, 2));
    console.log();
  }
})();
