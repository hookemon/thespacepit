/**
 * Find and consolidate duplicate releases created during the Drive sync.
 * Strategy: when two releases have the same normalized title fragment, prefer
 * the in-house catalog one (CC###/LDCC###/CLM###/hookemon###) and merge the
 * `release-ext-*` clone's data into it, then withdraw the ext copy.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD")
    .replace(/[‘’'`]/g, "")
    .replace(/\bs\s*\/\s*t\b/g, "")           // strip "s/t"
    .replace(/\b(ep|lp|single|mixtape|remixes)\b/g, "") // strip type suffixes
    .replace(/\([^)]*\)/g, "")                  // strip parens
    .replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");
}

(async () => {
  const all = await c.fetch<any[]>(
    `*[_type == "release" && (withdrawn != true)] {
      _id, title, "slug": slug.current, catalogNumber, label, year, releaseDate,
      "trackCount": count(tracklist),
      "creditCount": count(credits)
    }`
  );
  const groups = new Map<string, any[]>();
  for (const r of all) {
    const k = norm(r.title);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  console.log("\n🔍 Duplicate scan:\n");
  let dupeCount = 0;
  const toMerge: { keep: any; drop: any }[] = [];

  for (const [k, items] of groups) {
    if (items.length < 2) continue;
    dupeCount++;
    // Prefer the IN-HOUSE one (catalog # starts with CC, LDCC, CLM, hookemon)
    const inHouse = items.find(i => /^(CC|LDCC|CLM|hookemon)/i.test(i.catalogNumber || ""));
    const ext = items.find(i => i._id.startsWith("release-ext-"));
    if (inHouse && ext && inHouse._id !== ext._id) {
      toMerge.push({ keep: inHouse, drop: ext });
      console.log(`  DUPE: ${k!}`);
      console.log(`    KEEP: ${inHouse._id} (${inHouse.title}, ${inHouse.catalogNumber}, ${inHouse.trackCount}t/${inHouse.creditCount}c)`);
      console.log(`    DROP: ${ext._id} (${ext.title}, ${ext.trackCount}t/${ext.creditCount}c)`);
    } else {
      console.log(`  DUPE (manual): ${k!} — ${items.map((i: any) => i._id).join(", ")}`);
    }
  }
  console.log(`\n${dupeCount} duplicate groups, ${toMerge.length} auto-mergeable\n`);

  for (const { keep, drop } of toMerge) {
    // Pull richer fields from drop into keep, only when keep is missing them.
    const dropDoc = await c.fetch(`*[_id == $id][0]`, { id: drop._id });
    const keepDoc = await c.fetch(`*[_id == $id][0]`, { id: keep._id });
    const patch: Record<string, any> = {};
    if (!keepDoc.releaseDate && dropDoc.releaseDate) patch.releaseDate = dropDoc.releaseDate;
    if (!keepDoc.year && dropDoc.year) patch.year = dropDoc.year;
    if ((!keepDoc.tracklist || keepDoc.tracklist.length === 0) && dropDoc.tracklist?.length) patch.tracklist = dropDoc.tracklist;
    if ((!keepDoc.credits || keepDoc.credits.length === 0) && dropDoc.credits?.length) patch.credits = dropDoc.credits;
    if (Object.keys(patch).length > 0) {
      await c.patch(keep._id).set(patch).commit();
      console.log(`  ↳ enriched ${keep._id} with ${Object.keys(patch).join(", ")}`);
    }
    // Withdraw the dupe (don't delete — keeps refs intact, just hides from queries).
    await c.patch(drop._id).set({ withdrawn: true }).commit();
    console.log(`  ↳ withdrawn ${drop._id}`);
  }
  console.log("\n✅ done\n");
})();
