import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const gta = await c.fetch(`*[_type == "release" && (title match "*GTA*" || title match "*Grand Theft*" || title match "*Casino Heist*")]{ _id, title, "slug": slug.current, label, releaseDate, year, "artists": artists[]->name }`);
  console.log("=== GTA-related releases ==="); console.log(JSON.stringify(gta, null, 2));
  const kk = await c.fetch(`*[_type == "release" && "kid-kreep" in artists[]->slug.current || title match "*Kreep*"]{ _id, title, "slug": slug.current, label, releaseDate, year, "artists": artists[]->name }`);
  console.log("\n=== Kid Kreep releases ==="); console.log(JSON.stringify(kk, null, 2));
})();
