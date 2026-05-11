import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Same query that NHProductionCredits uses
  const r = await c.fetch(`*[
    _type == "release"
    && label == "Other"
    && (withdrawn != true)
    && count(credits[person->slug.current == "nick-hook"]) > 0
  ] | order(releaseDate desc, year desc) {
    _id, title, "slug": slug.current, year, releaseDate
  }`);
  console.log(`Showing on /nick-hook production credits: ${r.length}`);
  for (const x of r) {
    if (/red|bull|tour|sizarr/i.test(x.title)) {
      console.log(`  ⚠ ${x._id}  ${x.title}  date=${x.releaseDate || x.year}`);
    }
  }
  console.log("");
  console.log("ALL of them:");
  for (const x of r) console.log(`  ${x.title.padEnd(50)}  ${x._id}`);
})();
