/* eslint-disable no-console */
/**
 * Add the Pitchfork Best New Track review of the original 2014 Old English
 * single to the press archive, linked to the Old English remix release so it
 * surfaces in the release page's press grid with the BNT badge.
 *
 * Pitchfork blocks our user agent for crawl, so the pullquote is left as a
 * placeholder — drop the real text in via Sanity Studio when ready.
 *
 * Run: npx tsx scripts/add-pitchfork-old-english.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-old-english-spinn-hook-remix";

async function main() {
  const doc = {
    _id: "press-oe-pitchfork-bnt-2014",
    _type: "pressQuote",
    kind: "review",
    outlet: "Pitchfork",
    date: "2014-07-01",
    year: 2014,
    headline:
      'Freddie Gibbs / Young Thug / A$AP Ferg: "Old English"',
    quote:
      "Best New Track — Pitchfork's editorial seal on the 2014 Salva + Nick Hook single.",
    url: "https://pitchfork.com/reviews/tracks/16975-freddie-gibbs-young-thug-aap-ferg-old-english/",
    source: "Pitchfork · Best New Track",
    bestNew: true,
    featured: true,
    relatedRelease: { _type: "reference", _ref: RELEASE_ID },
  };
  await client.createOrReplace(doc);
  console.log(`✓ ${doc._id} (Pitchfork Best New Track)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
