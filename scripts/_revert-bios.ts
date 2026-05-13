/**
 * Revert every bio block that was written by the wiki-bio scraper.
 * Identifies them by the `_key: "wiki-bio-N"` we set during seeding.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
async function main() {
  // Find artists whose bio array contains a block with our scraper _key
  const targets = await sanity.fetch<{ _id: string; name: string }[]>(`
    *[_type == "artist" && defined(bio) && count(bio[_key match "wiki-bio*"]) > 0]{ _id, name }
  `);
  console.log(`reverting ${targets.length} bios…`);
  for (const a of targets) {
    await sanity.patch(a._id).unset(["bio"]).commit();
    console.log(`  ✓ ${a.name}`);
  }
}
main().catch(console.error);
