import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Search release tracklists, credits, and titles for Dam-Funk anywhere
  const r = await c.fetch(`*[_type == "release" && (
    title match "*Dam*Funk*" || title match "*DāM*FunK*" || title match "*DaM-FunK*" ||
    references("artist-dam-funk") || references("artist-ext-dam-funk-nick-hook") ||
    count(tracklist[feature match "*Dam*Funk*" || feature match "*DāM*FunK*" || title match "*Dam*Funk*" || note match "*Dam*Funk*"]) > 0 ||
    count(credits[name match "*Dam*Funk*" || name match "*DāM*FunK*"]) > 0
  )]{_id, title, "slug": slug.current, label, "artists": artists[]->name, "features": tracklist[].feature, "credits": credits[]{role, name, "personSlug": person->slug.current}}`);
  console.log(JSON.stringify(r, null, 2));
})();
