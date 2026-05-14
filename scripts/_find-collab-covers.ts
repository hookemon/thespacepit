/* eslint-disable no-console */
// Find the most iconic 3 release slugs per collab chapter so we can curate
// the cover thumbnail strip on /collabs.
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

async function search(label: string, artistMatch: string) {
  const r = await client.fetch(
    `*[_type == "release" && (artists[]->name match $q)]{
      _id, title, "slug": slug.current, year,
      catalogNumber,
      "hasCover": defined(cover),
      "artistNames": artists[]->name
    } | order(year asc)`,
    { q: `*${artistMatch}*` },
  );
  console.log(`\n— ${label} (artist match: "${artistMatch}") → ${r.length}`);
  for (const x of r.slice(0, 15)) {
    console.log(`  ${x.hasCover ? "✓" : " "} ${x.slug.padEnd(45)} ${x.title} (${x.year ?? "?"}) [${x.catalogNumber ?? "—"}]`);
  }
}

async function main() {
  await search("RTJ", "Run The Jewels");
  await search("MWC", "Men Women");
  await search("Cubic Zirconia", "Cubic Zirconia");
  await search("Gangsta Boo", "Gangsta Boo");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
