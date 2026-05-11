import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
(async () => {
  const r = await c.fetch(
    `*[_type=="release" && (count(stems) > 0 || count(oneshots) > 0)]{
      _id, title, "slug": slug.current,
      "stemCount": count(stems),
      "oneshotCount": count(oneshots),
      stemsTrackTitle
    } | order(stemCount desc, oneshotCount desc)`
  );
  console.log(`\nReleases with stems or oneshots: ${r.length}\n`);
  for (const x of r) {
    console.log(`  /releases/${x.slug}`);
    console.log(`    title: ${x.title}`);
    console.log(`    stems: ${x.stemCount}  oneshots: ${x.oneshotCount}  stemsTrackTitle: ${x.stemsTrackTitle ?? '—'}`);
  }
})();
