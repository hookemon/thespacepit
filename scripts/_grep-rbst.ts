import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[
    _type in ["release","project","studioSession","show","liveDate","brand","studio","mix","video"]
    && (
      title match "*Red Bull*" || name match "*Red Bull*" ||
      title match "*RBST*" || name match "*RBST*" ||
      title match "*Studios Tour*" || name match "*Studios Tour*"
    )
  ]{_type, _id, title, name, "slug": slug.current}`);
  console.log(JSON.stringify(r, null, 2));
})();
