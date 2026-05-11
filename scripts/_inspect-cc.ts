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
  const cc = await c.fetch(
    `*[_type == "release" && label == "Calm + Collect" && (withdrawn != true)]
      | order(catalogNumber asc) {
      _id, "slug": slug.current, catalogNumber, title, year
    }`
  );
  const ldcc = await c.fetch(
    `*[_type == "release" && label == "Lockhart Dynasty × Calm + Collect" && (withdrawn != true)]
      | order(catalogNumber asc) { _id, catalogNumber, title }`
  );
  const ccInst = await c.fetch(
    `*[_type == "release" && label == "Calm + Collect Instrumental" && (withdrawn != true)]
      | order(catalogNumber asc) { _id, catalogNumber, title }`
  );
  const ccProject = await c.fetch(
    `*[_id == "project-calm-collect"][0]{_id, name, "slug": slug.current, releases[]->{_id, catalogNumber}}`
  );
  const ldccProject = await c.fetch(
    `*[_id == "project-lockhart-dynasty-calm-collect"][0]{_id, name, "slug": slug.current, releases[]->{_id, catalogNumber}}`
  );
  console.log(JSON.stringify({ ccCount: cc.length, cc, ldccCount: ldcc.length, ldcc, ccInstCount: ccInst.length, ccInst, ccProject, ldccProject }, null, 2));
})();
