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
(async () => {
  const all = await client.fetch<{ catalogNumber: string; title: string; cover: unknown; label: string }[]>(
    `*[_type == "release" && (withdrawn != true)] | order(catalogNumber asc) { catalogNumber, title, cover, label }`
  );
  console.log("WITH COVERS:");
  for (const r of all) if (r.cover) console.log(`  ✓ ${r.catalogNumber} · ${r.title}`);
  console.log("\nMISSING COVERS:");
  for (const r of all) if (!r.cover) console.log(`  ✗ ${r.catalogNumber} · ${r.title}`);
})();
