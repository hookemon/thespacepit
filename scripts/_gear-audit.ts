import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const broken = await c.fetch(`*[_type == "gear" && (name match "*PO-*" || name match "*Pocket Operator*" || tagline match "*broken*" || note match "*broken*" || status match "*broken*")]{_id, name, "slug": slug.current, tagline}`);
  console.log("PO / broken:", JSON.stringify(broken, null, 2));
  console.log();
  const sp = await c.fetch(`*[_type == "gear" && (name match "*SP-1200*" || name match "*SP1200*" || _id match "*sp-1200*")]{_id, name, "slug": slug.current}`);
  console.log("SP-1200:", JSON.stringify(sp, null, 2));
})();
