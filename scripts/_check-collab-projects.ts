/* eslint-disable no-console */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  const slugs = ["run-the-jewels", "men-women-children", "cubic-zirconia", "gangsta-boo"];
  for (const slug of slugs) {
    const p = await client.fetch(
      `*[_type == "project" && slug.current == $slug][0]{
        _id, name, "slug": slug.current,
        "releaseCount": count(releases),
        "firstCovers": releases[]->{ "slug": slug.current, title, cover } [0...4]
      }`,
      { slug },
    );
    console.log(`\n${slug}:`, p ? `${p.releaseCount ?? 0} releases — ${p.name}` : "✗ NOT FOUND");
    if (p?.firstCovers) {
      for (const c of p.firstCovers) {
        if (!c) continue;
        console.log(`  · ${c.title} — cover: ${c.cover ? "✓" : "✗"}`);
      }
    }
  }
  // Also look at any project doc that contains our 4 collab names.
  console.log("\n--- ALL project docs ---");
  const all = await client.fetch(
    `*[_type == "project"]{ _id, name, "slug": slug.current, "releaseCount": count(releases) } | order(name asc)`,
  );
  for (const p of all) console.log(`  ${p.slug.padEnd(40)} ${p.name} (${p.releaseCount ?? 0} releases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
