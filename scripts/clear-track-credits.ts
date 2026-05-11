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
  // Wipe credits[] from any release where the first credit's role starts with "Track"
  // (those are the hacky tracklist entries the old patch script wrote).
  const ids = await client.fetch<string[]>(
    `*[_type == "release" && defined(credits) && count(credits[role match "Track*"]) > 0]._id`
  );
  console.log(`Clearing track-shaped credits from ${ids.length} releases:`, ids);
  if (ids.length === 0) { console.log("nothing to clear"); return; }
  for (const id of ids) {
    await client.patch(id).unset(["credits"]).commit();
  }
  console.log(`✅ cleared`);
})();
