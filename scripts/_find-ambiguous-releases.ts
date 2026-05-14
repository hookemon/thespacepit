/* eslint-disable no-console */
// Search Sanity for releases that might match the ambiguous cover-art credits:
//   Spiritual Friendship 4, Yoga Fire, Novelist, 21 Savage, Cubic Zirconia "Fuck Work"
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

const TERMS = [
  "spiritual friendship",
  "yoga fire",
  "novelist",
  "21 savage",
  "fuck work",
  "cubic zirconia",
];

async function main() {
  for (const term of TERMS) {
    const results = await client.fetch(
      `*[_type == "release" && (
        title match $q ||
        catalogNumber match $q ||
        slug.current match $q ||
        artists[]->name match $q
      )]{
        _id, title, "slug": slug.current, catalogNumber, year,
        "artistNames": artists[]->name
      } | order(year asc)`,
      { q: `*${term}*` },
    );
    console.log(`\n— "${term}" → ${results.length} matches`);
    for (const r of results.slice(0, 10)) {
      console.log(
        `  ${r._id} :: ${r.title} ${r.catalogNumber ? `[${r.catalogNumber}]` : ""} (${r.year ?? "?"}) — ${(r.artistNames ?? []).join(", ")}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
