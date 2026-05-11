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
  const ids = await client.fetch<string[]>(
    `*[_type == "release" && label == "Calm + Collect Instrumental" && catalogNumber != "CCINST001"]._id`
  );
  console.log("Removing:", ids);
  if (ids.length === 0) { console.log("nothing to remove"); return; }
  const tx = client.transaction();
  for (const id of ids) tx.delete(id);
  await tx.commit({ visibility: "async" });
  console.log(`✅ removed ${ids.length} unreleased instrumentals`);
})();
