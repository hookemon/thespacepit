/**
 * Seed press quotes for the Men Women & Children era and link them.
 *
 * Source: press_archive_MWC.md (the "Critical Reviews" + UK Press sections).
 *
 * Idempotent — re-runnable.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const QUOTES = [
  {
    _id: "press-mwc-nme-2006",
    quote: "Highly rated newcomers.",
    source: "NME",
    year: 2006,
  },
  {
    _id: "press-mwc-skinny-2006",
    quote: "Earth, Wind & Fire shaking bossa nova ass with The Mars Volta — it all works well without the buzz-saw riffery.",
    source: "Dave Kerr · The Skinny ★★★",
    year: 2006,
  },
  {
    _id: "press-mwc-sputnikmusic-2007",
    quote: "Stand aside, Mr. Timberlake — Men, Women And Children are here to claim the 'most danceable record of 2006' award.",
    source: "Sputnikmusic · 3.5/5",
    year: 2007,
  },
  {
    _id: "press-mwc-amazon-2006",
    quote: "An ambitious, infectious, over-the-top and liberating spectacle. A reminder that rock can be fun.",
    source: "Amazon · official label copy",
    year: 2006,
  },
];

(async () => {
  console.log("\n📰 Seeding MWC press quotes\n");
  for (const q of QUOTES) {
    await client.createOrReplace({
      _id: q._id,
      _type: "pressQuote",
      quote: q.quote,
      source: q.source,
      year: q.year,
      featured: false, // era-page only, don't pollute the artist-site press wall
    });
    console.log(`   ✓ ${q.source} (${q.year})`);
  }

  console.log("\n→ linking to project-men-women-children...");
  await client
    .patch("project-men-women-children")
    .set({
      pressQuotes: QUOTES.map((q) => ({
        _type: "reference",
        _ref: q._id,
        _key: `pq-${q._id}`,
      })),
    })
    .commit();
  console.log(`   ✓ ${QUOTES.length} quotes linked`);

  console.log("\n✅ done — refresh /eras/men-women-children\n");
})();
