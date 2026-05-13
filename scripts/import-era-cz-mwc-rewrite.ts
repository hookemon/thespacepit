/**
 * CZ + MWC era page rewrite — applying Nick's two corrections:
 *
 *   1. Album-art palette + tour-photo hero on Cubic Zirconia
 *      · color: deep navy/steel pulled from the Follow Your Heart cover
 *        (was wrongly the Lockhart Dynasty red — that's the catalog stamp,
 *        not the band's visual identity)
 *      · cover: img312 from the CZ tour photo set — the Tiombe + Daud + Nick
 *        mural shot, B&W high contrast, full-bleed energy
 *
 *   2. Band-first framing on every era doc — drop the "nick on keys"
 *      / "nick's first band" framing. The bands were units, not Nick + others.
 *      Tagline reads as the band's own bio, not Nick's resume bullet.
 *
 *   3. Cubic Zirconia member list cleanup — drop Rick Penzone (he was MWC,
 *      not CZ) and Todd Weinstock (briefly there at the start, left for other
 *      projects). Promote Daud Sturdivant + Tiombe Lockhart + Nick alongside.
 *
 * Run: `npx tsx scripts/import-era-cz-mwc-rewrite.ts`
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

// img312 — the iconic Tiombe + Daud + Nick mural portrait. Already in
// Sanity from tonight's bulk photo import.
const IMG312_ASSET = "image-7b6b498f7fa0910488509c936d14de7e9ac80570-2000x1308-jpg";

// Steel navy pulled from the Follow Your Heart cover — the deep blue-black
// that the crinkled silver foil heart sits on. Replaces the Lockhart Dynasty
// red (#9B1B1B) which was a catalog stamp, not the band's actual palette.
const CZ_COLOR = "#0E1B2C";

(async () => {
  console.log("\n🎨 Era page rewrites — CZ + MWC\n");

  // Resolve member artist refs by slug
  const memberSlug = async (slug: string) => {
    const id = await c.fetch(`*[_type == "artist" && slug.current == $slug][0]._id`, { slug });
    return id ? { _type: "reference", _ref: id, _key: id.slice(0, 8) } : null;
  };

  // ── CUBIC ZIRCONIA ──────────────────────────────────────────
  const cz = await c.fetch(`*[_type=='project' && slug.current=='cubic-zirconia'][0]{ _id }`);
  if (!cz) throw new Error("CZ project doc not found");

  const tiombe = await memberSlug("tiombe-lockhart");
  const daud = await memberSlug("daud-sturdivant");
  const nick = await memberSlug("nick-hook");
  const czMembers = [tiombe, daud, nick].filter(Boolean);

  await c.patch(cz._id).set({
    color: CZ_COLOR,
    tagline:
      "tiombe lockhart, daud sturdivant, nick conceller. brooklyn techno-soul disguised as ethnic disco. a fool's gold passport. don't cry → night slugs → fool's gold. four years that ran the whole loft circuit.",
    cover: {
      _type: "image",
      asset: { _type: "reference", _ref: IMG312_ASSET },
    },
    members: czMembers,
  }).commit();
  console.log(`✓ Cubic Zirconia patched`);
  console.log(`   color   → ${CZ_COLOR} (was the wrong red)`);
  console.log(`   cover   → img312 (Tiombe + Daud + Nick mural shot)`);
  console.log(`   tagline → band-first, no "nick on keys"`);
  console.log(`   members → Tiombe + Daud + Nick (dropped Rick + Todd — they belonged elsewhere)`);

  // ── MEN, WOMEN & CHILDREN ───────────────────────────────────
  const mwc = await c.fetch(`*[_type=='project' && slug.current=='men-women-children'][0]{ _id }`);
  if (!mwc) throw new Error("MWC project doc not found");

  await c.patch(mwc._id).set({
    tagline:
      "tj penzone, todd weinstock, rick penzone, scully sullivan-kaplan, nick conceller. long island electropop dance-rock. one full-length on warner brothers / reprise (2006), 183 shows, mtv tours and brixton afters, tour van robbed in detroit, dissolved at the gramercy theatre december 29 2008.",
  }).commit();
  console.log(`\n✓ Men Women & Children patched`);
  console.log(`   tagline → band-first, no "nick on keys / Nick's first band"`);

  console.log(`\n💡 Both eras now read as the BAND, not as Nick's resume.`);
  console.log(`   Same principle queued for any future era doc — never frame an`);
  console.log(`   ensemble through a single member's perspective.\n`);
})();
