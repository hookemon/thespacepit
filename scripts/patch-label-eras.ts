/**
 * Wire the label-era project pages to their catalogs.
 *
 *  - project-calm-collect ← all releases where label == "Calm + Collect"
 *  - project-lockhart-dynasty-calm-collect ← all releases where
 *      label == "Lockhart Dynasty × Calm + Collect" (LDCC001–006)
 *
 * Pulls the release IDs at runtime so the wiring stays in sync as the
 * catalog grows. Idempotent.
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

const MAP: { projectId: string; label: string }[] = [
  { projectId: "project-calm-collect", label: "Calm + Collect" },
  { projectId: "project-lockhart-dynasty-calm-collect", label: "Lockhart Dynasty × Calm + Collect" },
];

(async () => {
  console.log("\n🔗 Wiring label-era projects to their catalogs\n");

  for (const m of MAP) {
    const releases = await client.fetch<{ _id: string; catalogNumber?: string }[]>(
      `*[_type == "release" && label == $label && (withdrawn != true)]
        | order(catalogNumber asc) { _id, catalogNumber }`,
      { label: m.label }
    );

    if (releases.length === 0) {
      console.log(`   ⏭  ${m.projectId} — no releases matched label "${m.label}"`);
      continue;
    }

    await client
      .patch(m.projectId)
      .set({
        releases: releases.map((r) => ({
          _type: "reference",
          _ref: r._id,
          _key: `rel-${r._id}`,
        })),
      })
      .commit();

    console.log(`   ✓ ${m.projectId} ← ${releases.length} releases (${releases[0].catalogNumber} → ${releases[releases.length - 1].catalogNumber})`);
  }

  console.log("\n✅ done\n");
})();
