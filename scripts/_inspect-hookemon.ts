import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

(async () => {
  const r = await c.fetch(
    `*[_type == "release" && (label == "Hookemon" || catalogNumber match "hookemon*")]{
      _id, title, "slug": slug.current, catalogNumber, year, label,
      "artists": artists[]->name
    } | order(catalogNumber asc)`
  );
  console.log(JSON.stringify(r, null, 2));
})();
