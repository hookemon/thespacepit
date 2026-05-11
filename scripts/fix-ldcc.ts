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
  const oldIds = await client.fetch<string[]>(`*[_type == "release" && catalogNumber match "LDCC001*" && length(catalogNumber) > 7]._id`);
  console.log("Removing old LDCC001a-f:", oldIds);
  if (oldIds.length === 0) { console.log("nothing to remove"); return; }
  const tx = client.transaction();
  for (const id of oldIds) tx.delete(id);
  await tx.commit({ visibility: "async" });
  console.log(`✅ removed ${oldIds.length} old docs`);
})();
