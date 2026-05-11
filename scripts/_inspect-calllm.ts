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
  const releases = await c.fetch(
    `*[_type == "release" && (label == "Calllm" || catalogNumber match "CLM*" || catalogNumber match "clm*")]{
      _id, title, "slug": slug.current, catalogNumber, year, label,
      "artists": artists[]->name
    } | order(catalogNumber asc)`
  );
  const sf = await c.fetch(
    `*[_type == "artist" && (name match "Spiritual*" || slug.current match "spiritual*")]{_id, name, "slug": slug.current}`
  );
  const project = await c.fetch(
    `*[_id == "project-calllm-ambient-sub-label"][0]{_id, name, "slug": slug.current, releases[]->{_id, title, catalogNumber}, members[]->{_id, name}}`
  );
  console.log(JSON.stringify({ releases, spiritualFriendship: sf, project }, null, 2));
})();
