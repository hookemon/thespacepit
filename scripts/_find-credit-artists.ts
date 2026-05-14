/* eslint-disable no-console */
// Find artist docs for the cover-credit names so I can wire reference links.
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

const NAMES = ["Gareth Jones", "Nick Hook", "James", "Mike Davis"];

async function main() {
  for (const name of NAMES) {
    const results = await client.fetch(
      `*[_type == "artist" && (name match $q || slug.current match $q)]{
        _id, name, "slug": slug.current
      } | order(name asc)`,
      { q: `*${name}*` },
    );
    console.log(`\n— "${name}" → ${results.length} matches`);
    for (const r of results.slice(0, 10)) {
      console.log(`  ${r._id} :: ${r.name} (slug: ${r.slug})`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
