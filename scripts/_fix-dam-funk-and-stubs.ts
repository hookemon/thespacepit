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

const NEW_DAM = "artist-dam-funk";
const OLD_MERGED = "artist-ext-dam-funk-nick-hook";

(async () => {
  // 1. Withdraw the Young Thug × Nick Hook remix stub (placeholder, not a real release yet)
  await c.patch("release-stub-young-thug-nick-hook-remix").set({ withdrawn: true }).commit();
  console.log("✓ withdrew release-stub-young-thug-nick-hook-remix");

  // 2. Create proper Dam-Funk artist doc
  await c.createIfNotExists({
    _id: NEW_DAM,
    _type: "artist",
    name: "DāM-FunK",
    slug: { _type: "slug", current: "dam-funk" },
    onLabel: false,
    tagline: "modern-funk king. dam-funk presents the music of grand theft auto.",
  });
  console.log(`✓ ensured artist-dam-funk exists (DāM-FunK)`);

  // 3. Repoint every reference from the merged "Dam Funk + Nick Hook" doc → the proper one
  const refs: { _id: string; _type: string; title?: string; name?: string }[] = await c.fetch(
    `*[references($old)]{_id, _type, title, name}`,
    { old: OLD_MERGED }
  );
  console.log(`\n→ ${refs.length} docs reference the merged-name artist doc:`);
  for (const doc of refs) {
    console.log(`   - ${doc._type}: ${doc.title ?? doc.name ?? doc._id}`);
  }

  // For each referencing doc, replace the _ref in artists[] / members[] / wherever
  for (const doc of refs) {
    const full: any = await c.fetch(`*[_id == $id][0]`, { id: doc._id });
    let changed = false;
    const replaceInArray = (arr: any[]): any[] => {
      return arr.map((item) => {
        if (item?._ref === OLD_MERGED) {
          changed = true;
          return { ...item, _ref: NEW_DAM };
        }
        return item;
      });
    };
    const updated: any = { ...full };
    for (const key of ["artists", "members", "credits"]) {
      if (Array.isArray(updated[key])) {
        if (key === "credits") {
          // credits are objects with optional .person (a ref); patch nested ref
          updated[key] = updated[key].map((cr: any) => {
            if (cr?.person?._ref === OLD_MERGED) {
              changed = true;
              return { ...cr, person: { ...cr.person, _ref: NEW_DAM } };
            }
            return cr;
          });
        } else {
          updated[key] = replaceInArray(updated[key]);
        }
      }
    }
    if (changed) {
      await c.patch(doc._id).set({
        ...(Array.isArray(updated.artists) ? { artists: updated.artists } : {}),
        ...(Array.isArray(updated.members) ? { members: updated.members } : {}),
        ...(Array.isArray(updated.credits) ? { credits: updated.credits } : {}),
      }).commit();
      console.log(`   ↳ repointed ${doc._id}`);
    }
  }

  // 4. Withdraw the merged stub artist (it was a placeholder; keep doc for audit, just hide)
  // Artists don't have a withdrawn field — but we can rename it for clarity.
  await c.patch(OLD_MERGED).set({
    name: "(deprecated — see DāM-FunK)",
  }).commit();
  console.log(`\n✓ deprecated the merged-name doc (audit trail kept)`);

  console.log("\n✅ done\n");
})();
