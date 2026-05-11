import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_id == "release-ext-red-bull-studios-tour"][0]{
    _id, title, label, withdrawn, "slug": slug.current,
    "credits": credits[]{role, name, "personSlug": person->slug.current}
  }`);
  console.log(JSON.stringify(r, null, 2));
})();
