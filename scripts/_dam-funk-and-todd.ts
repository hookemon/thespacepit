import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DAM_PATTERN = /\b(dam[\s-]?funk|d[āa]m[\s-]?funk|dām[\s-]?funk)\b/i;

(async () => {
  // 1. Bulk-tag existing videos that mention Dam-Funk in title
  const candidates: { _id: string; title: string; tags?: string[] }[] = await c.fetch(
    `*[_type == "video" && hidden != true]{_id, title, tags}`
  );
  let tagged = 0;
  for (const v of candidates) {
    if (!DAM_PATTERN.test(v.title)) continue;
    const tags = new Set(v.tags ?? []);
    if (tags.has("dam-funk")) continue;
    tags.add("dam-funk");
    await c.patch(v._id).set({ tags: [...tags] }).commit();
    tagged++;
    console.log(`  ✓ ${v.title.slice(0, 80)}`);
  }
  console.log(`\n📺 ${tagged} videos newly tagged dam-funk`);

  // 2. Create Todd Terry artist
  await c.createIfNotExists({
    _id: "artist-ext-todd-terry",
    _type: "artist",
    name: "Todd Terry",
    slug: { _type: "slug", current: "todd-terry" },
    onLabel: false,
    tagline: "house music originator. NY club legend. tnt.",
  });
  console.log(`\n✓ ensured artist-ext-todd-terry exists\n`);

  // 3. Scan Drive Release Catalog for any CZ + Dam-Funk collab
  try {
    const data = JSON.parse(readFileSync(resolve(process.cwd(), "scripts/data/release-catalog-from-drive.json"), "utf8"));
    console.log("🔎 Drive catalog scan for CZ + Dam-Funk collabs:");
    let hits = 0;
    for (const [k, rel] of Object.entries(data) as [string, any][]) {
      if (k.startsWith("_")) continue;
      const text = JSON.stringify(rel).toLowerCase();
      const isCZ = text.includes("cubic zirconia") || text.includes("tiombe") || text.includes("zirconia");
      const isDam = /dam[\s-]?funk|dām[\s-]?funk/i.test(text);
      if (isCZ && isDam) {
        console.log(`  HIT: ${rel.title}  (${rel.label})`);
        hits++;
      }
    }
    if (hits === 0) console.log("  (none found in the Drive Release Catalog — songs may live only on Tiombe's solo catalog or off-platform)");
  } catch (e) {
    console.log("  (Drive catalog JSON not available)");
  }
})();
