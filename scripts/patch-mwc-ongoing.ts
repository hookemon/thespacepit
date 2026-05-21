/**
 * Reframe MWC from a closed-out band era to an active project. New music
 * for the first time in 20 years — set yearStart back to 2003 (the actual
 * forming year per Nick) and clear yearEnd so the era reads as ongoing.
 *
 * Run: npx tsx scripts/patch-mwc-ongoing.ts
 */
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

(async () => {
  await client
    .patch("project-men-women-children")
    .set({ yearStart: 2003 })
    .unset(["yearEnd", "kind"])
    .commit();
  console.log("✓ MWC project: yearStart=2003, yearEnd cleared, kind cleared");
})().catch((e) => { console.error(e); process.exit(1); });
