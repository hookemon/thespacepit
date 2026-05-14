/**
 * Import the 2014 press for "Old English" (Young Thug + Ferg + Freddie Gibbs,
 * prod. Salva & Nick Hook) as pressQuote docs and link them to the
 * Old English (DJ Spinn + Nick Hook Remix) release.
 *
 * These pieces are about the ORIGINAL 2014 Mass Appeal single; the remix
 * release page reuses them as historical context — the same beat, same
 * verses, now flipped for footwork.
 *
 * Run: npx tsx scripts/import-old-english-press.ts
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
  kind: "review" | "feature" | "interview" | "premiere";
  outlet: string;
  author: string;
  date: string; // ISO
  headline: string;
  quote: string;
  url: string;
};

const PRESS: PressItem[] = [
  {
    id: "press-oe-consequence-2014",
    kind: "premiere",
    outlet: "Consequence of Sound",
    author: "Chris Coplan",
    date: "2014-06-30",
    headline: 'Listen to "Old English", a new song from A$AP Ferg, Young Thug, and Freddie Gibbs',
    quote:
      "Each of the three emcees are somewhat dichotomous — producers Salva and Nick Hook unite them under one beat of dense bass and jarring piano samples.",
    url: "https://consequence.net/2014/06/listen-to-old-english-a-new-song-from-asap-ferg-young-thug-and-freddie-gibbs/",
  },
  {
    id: "press-oe-hotnewhiphop-2014",
    kind: "review",
    outlet: "HotNewHipHop",
    author: "Aron A.",
    date: "2014-06-30",
    headline: 'Young Thug, A$AP Ferg & Freddie Gibbs Poured Out "Old English" Over A Salva Beat',
    quote:
      "With the help of Salva and Nick Hook who handle the trap-heavy production, Thug, Ferg, and Gibbs swag oozes on the track with their contrasting flows — but there's a darker undertone underneath it all.",
    url: "https://www.hotnewhiphop.com/190094-young-thug-asap-ferg-and-freddie-gibbs-poured-out-old-english-over-a-salva-beat-new-song",
  },
  {
    id: "press-oe-allhiphop-2014",
    kind: "interview",
    outlet: "AllHipHop",
    author: "Yohance Kyles",
    date: "2014-07-11",
    headline:
      'Producers Salva & Nick Hook Discuss "Old English" Feat. Young Thug, Freddie Gibbs & A$AP Ferg',
    quote:
      "It's all based on friendship and art. I think a lot of people think 'they must have paid these fools for their verses.' — Nick Hook",
    url: "https://allhiphop.com/features/producers-salva-nick-hook-discuss-old-english-feat-young-thug-freddie-gibbs-aap-ferg-other-projects/",
  },
  {
    id: "press-oe-needledrop-2014",
    kind: "review",
    outlet: "The Needle Drop",
    author: "Anthony Fantano",
    date: "2014-07-15",
    headline:
      '"Old English" ft. Young Thug, A$AP Ferg, and Freddie Gibbs (prod. Salva & Nick Hook)',
    quote:
      "Young Thug, A$AP Ferg, and Freddie Gibbs are freaking fire on this thing — and producers Salva and Nick Hook turn out a top-notch, banging beat.",
    url: "https://theneedledrop.com/2014-07-mass-appeal-old-english-ft-young-thug-aap-ferg-and-freddie-gibbs-prod-salva-nick-hook/",
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
  console.log(`\nImported ${PRESS.length} press pieces for Old English.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
