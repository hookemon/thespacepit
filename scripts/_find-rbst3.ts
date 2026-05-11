import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Count of all ext releases
  const total = await c.fetch(`count(*[_type == "release" && _id match "release-ext-*"])`);
  console.log(`Total ext releases: ${total}`);
  const r = await c.fetch(`*[_type == "release" && _id match "release-ext-*" && title > "N"] | order(title asc) { _id, title }`);
  for (const x of r) console.log(`  ${x._id.padEnd(60)}  ${x.title}`);
})();
