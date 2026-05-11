/**
 * Seed the Teenage Engineering brand page.
 *
 * Different shape from Ableton: TE doesn't have a single canonical "Nick
 * Hook article" the way Ableton blog does, so we skip the article reader
 * entirely. Instead the page leans on:
 *
 *   · the auto-pulled fullRack (every TE-manufactured gear doc Nick owns)
 *   · the 16 video demos already wired via relatedBrand (K.O. + EP-1320 + TP-7)
 *   · a quick story line setting context
 *
 * Also pins a few key TE pieces (OP-1 field, OP-Z, OP-XY, EP-133, TX-6) so
 * they sort to the front of the rack grid.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const PIN_SLUGS = [
  "te-op-1-field",
  "te-op-z",
  "teenage-engineering-op-xy-synthesizer-sequencer",
  "te-ep-133-ko-ii",
  "te-tx-6",
  "te-ep-1320",
  "te-tp-7",
];

async function main() {
  // 1. Patch brand doc with tagline, relationship, featured
  console.log("→ patching TE brand doc…");
  await sanity.patch("brand-teenage-engineering").set({
    tagline: "operator · OP-1 · OP-Z · OP-XY · move · ko ii · ep-1320 · tp-7. mentor since 2017.",
    relationship: "artist mentor",
    websiteUrl: "https://teenage.engineering/",
    featured: true,
    // Light intro on the partner page so the rack section has context.
    story: [
      {
        _type: "block",
        _key: "te-story-1",
        style: "normal",
        children: [
          { _type: "span", _key: "s1", text: "Stockholm to Brooklyn. " },
          { _type: "span", _key: "s2", text: "Officially a TE mentor since 2017", marks: ["strong"] },
          { _type: "span", _key: "s3", text: " — every piece below has been on a record, on stage, or in a workshop. The OP-1 lives in my travel bag. The K.O. II runs my live set. The EP-1320 is the new medieval one. They build the tools, I push them through the spacepit." },
        ],
        markDefs: [],
      },
    ],
  }).commit();
  console.log("   ✓ tagline + story + featured set");

  // 2. Pin the highlight pieces in the rack
  console.log("\n→ pinning key TE rack pieces…");
  for (const slug of PIN_SLUGS) {
    const id = await sanity.fetch<string | null>(
      `*[_type == "gear" && slug.current == $slug][0]._id`,
      { slug }
    );
    if (!id) { console.log(`   ✗ ${slug} not found`); continue; }
    await sanity.patch(id).set({ pinned: true }).commit();
    console.log(`   ✓ pinned ${slug}`);
  }

  console.log("\n→ done. open http://localhost:3000/partners/teenage-engineering");
}

main().catch((err) => { console.error(err); process.exit(1); });
