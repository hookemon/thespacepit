import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_type == "release" && (title match "*Red Bull*Studios*" || _id match "*red-bull-studios*")]{ _id, title, "slug": slug.current }`);
  console.log("matches:", r);
  for (const x of r) {
    await c.patch(x._id).set({ withdrawn: true }).commit();
    console.log(`✓ withdrew ${x._id} (${x.title})`);
  }
})();
