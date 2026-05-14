/* eslint-disable no-console */
// Show current credits + cover state on the candidate releases so I can
// pick the right one for each ambiguous credit.
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

const IDS = [
  "release-cc023-iv",
  "release-ext-lazaro",
  "release-cc020-the-crystal",
  "release-ext-street-politican",
  "release-cc016-cant-tell-me-nothing-remixes",
  "release-cc014-head",
  "release-ext-fuck-work",
];

async function main() {
  for (const id of IDS) {
    const r = await client.fetch(
      `*[_id == $id][0]{
        _id, title, catalogNumber,
        "artistNames": artists[]->name,
        cover,
        "credits": credits[]{
          role, name, "personName": person->name, "personSlug": person->slug.current
        }
      }`,
      { id },
    );
    if (!r) {
      console.log(`✗ NOT FOUND: ${id}`);
      continue;
    }
    console.log(`\n${r._id} :: ${r.title} [${r.catalogNumber}] — ${(r.artistNames ?? []).join(", ")}`);
    console.log(`  cover: ${r.cover ? "✓" : "✗"}`);
    const artCredits = (r.credits ?? []).filter((c: { role?: string }) =>
      /cover|art|photo|design|layout/i.test(c.role ?? ""),
    );
    if (artCredits.length === 0) console.log(`  art credits: (none)`);
    for (const c of artCredits) {
      console.log(`  · ${c.role}: ${c.personName ?? c.name}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
