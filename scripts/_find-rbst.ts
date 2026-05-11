import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_type == "release" && (title match "*Red*" || title match "*Sizarr*" || title match "*Tour*" || label match "*Four Music*" || label match "*Red Bull*")]{ _id, title, "slug": slug.current, label, "artists": artists[]->name, releaseDate }`);
  console.log(JSON.stringify(r, null, 2));
})();
