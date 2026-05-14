/**
 * Round 2 of Old English press — the Ruffmercy animated video coverage
 * from Jan 2015. The video dropped 6 months after the single and got its
 * own press cycle (Basquiat-influenced animation), which is a meaningful
 * historical layer of this record's story.
 *
 * Run: npx tsx scripts/import-old-english-press-v2.ts
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

type PressItem = {
  id: string;
  kind: "feature" | "review";
  outlet: string;
  author: string;
  date: string;
  headline: string;
  quote: string;
  url: string;
};

const PRESS: PressItem[] = [
  {
    id: "press-oe-fader-video-2015",
    kind: "feature",
    outlet: "The FADER",
    author: "Zara Golden",
    date: "2015-01-12",
    headline:
      'Young Thug, Freddie Gibbs And A$AP Ferg\'s "Old English" Video Gives Us Basquiat Vibes',
    quote:
      "Like a lyric video, but better — Ruffmercy renders each rapper and their corresponding bars in colorful chalk outlines.",
    url: "https://www.thefader.com/2015/01/12/young-thug-freddie-gibbs-and-aap-fergs-old-english-video-gives-us-basquiat-vibes",
  },
  {
    id: "press-oe-stereogum-video-2015",
    kind: "review",
    outlet: "Stereogum",
    author: "Chris DeVille",
    date: "2015-01-12",
    headline: 'Young Thug, Freddie Gibbs & A$AP Ferg – "Old English" Video',
    quote:
      "Nick Hook and Salva create a strong combination of high-end twinkle and booming bass — Young Thug's slurring, Ziggy-Stardust delivery flies in the face of rugged rap orthodoxy.",
    url: "https://stereogum.com/1728641/young-thug-freddie-gibbs-aap-ferg-old-english-video/news",
  },
  {
    id: "press-oe-dezeen-ruffmercy-2015",
    kind: "feature",
    outlet: "Dezeen",
    author: "Dezeen",
    date: "2015-01-24",
    headline: "Ruffmercy creates Basquiat-influenced animated music video",
    quote:
      "There's no denying that there's a Basquiat influence going on here. I would usually avoid literal interpretations of song lyrics, but for this one it felt right. — Ruffmercy",
    url: "https://www.dezeen.com/2015/01/24/ruffmercy-music-video-old-english-single-young-thug-freddie-gibbs-asap-ferg-basquiat/",
  },
  {
    id: "press-oe-itsnicethat-2015",
    kind: "feature",
    outlet: "It's Nice That",
    author: "James Cartwright",
    date: "2015-01-29",
    headline: "Chopping chickens and boolin' with slimes in Ruffmercy's new video",
    quote:
      "It's a lyric video but not as we know it — scraps of slang flying up on screen in a brightly-coloured, childlike scrawl.",
    url: "https://www.itsnicethat.com/articles/ruffmercy-old-english",
  },
];

async function main() {
  for (const p of PRESS) {
    const doc = {
      _id: p.id,
      _type: "pressQuote",
      kind: p.kind,
      outlet: p.outlet,
      author: p.author,
      date: p.date,
      year: Number(p.date.slice(0, 4)),
      headline: p.headline,
      quote: p.quote,
      url: p.url,
      source: `${p.author} · ${p.outlet}`,
      relatedRelease: { _type: "reference", _ref: RELEASE_ID },
    };
    await client.createOrReplace(doc);
    console.log(`✓ ${p.id} (${p.outlet})`);
  }
  console.log(`\nImported ${PRESS.length} more press pieces for Old English.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
