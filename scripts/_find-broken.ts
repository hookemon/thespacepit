import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // ANYTHING with broken in any field
  const r = await c.fetch(`*[_type == "gear" && (
    pt::text(notes) match "*broken*" || tagline match "*broken*" || status match "*broken*" || name match "*broken*"
  )]{_id, name, "slug": slug.current, status, tagline}`);
  console.log(JSON.stringify(r, null, 2));
  // List all gear schema fields
  const sample = await c.fetch(`*[_type == "gear"][0]`);
  console.log("\nfield keys on a gear doc:", Object.keys(sample || {}));
})();
