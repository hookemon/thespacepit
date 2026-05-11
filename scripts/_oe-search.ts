import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[(title match "*old*english*" || title match "*Old English*" || _id match "*old-english*" || name match "*old english*")]{_type, _id, title, name, "slug": slug.current, "tracks": tracklist[]{title, note, feature}}`);
  console.log(JSON.stringify(r, null, 2));
})();
