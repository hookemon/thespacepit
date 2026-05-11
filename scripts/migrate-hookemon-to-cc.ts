/**
 * Migrate the three Hookemon-labeled releases to Calm + Collect.
 *
 * Per Nick (2026-05-10): the Hookemon imprint is being folded into C+C.
 * What changes:    only the `label` field on the release docs.
 * What stays:      cat numbers (hookemon001/002/003), slugs (so URLs don't
 *                  break), artist refs, and everything else.
 *
 * Effect:
 *   - These 3 releases now appear in the C+C catalogue (label == "Calm + Collect").
 *   - The Hookemon era page (/eras/hookemon-records) still shows them via
 *     the project's releases array.
 *   - The label-priority sort treats them as C+C (priority 1) instead of
 *     Hookemon (priority 4).
 *
 * Idempotent — safe to re-run (it just sets the same value again).
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_IDS = [
  "release-hookemon001-without-you",
  "release-hookemon002-spiritual-friendship-s-t",
  "release-hookemon003-friendship-remixes",
];

(async () => {
  console.log("\n📦 Migrating Hookemon → Calm + Collect\n");
  for (const id of RELEASE_IDS) {
    await client.patch(id).set({ label: "Calm + Collect" }).commit();
    console.log(`   ✓ ${id}  →  label = "Calm + Collect"`);
  }
  console.log("\n✅ done — cat numbers + slugs unchanged, just the label field\n");
})();
