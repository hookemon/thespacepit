import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_type == "release" && (title match "*Honest*" || title match "*Andy*Bell*" || title match "*Key*")]{ _id, title, "slug": slug.current, label, releaseDate }`);
  console.log("matching releases:", JSON.stringify(r, null, 2));
  const a = await c.fetch(`*[_type == "artist" && (name match "*Andy*" || name match "*Bell*" || name match "*Adrian*")]{ _id, name, "slug": slug.current }`);
  console.log("matching artists:", JSON.stringify(a, null, 2));
})();
