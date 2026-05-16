/**
 * Fix the KUSA copy site-wide: the record is in QUECHUA ONLY, not
 * trilingual. The previous tagline + liner notes had it as
 * "three tongues / Quechua, Spanish, English" which is wrong.
 *
 * The rare-ness IS the story — a fully-Quechua-rap commercial release from
 * the Cusco region is essentially unheard of. Lead with that.
 *
 * Run: npx tsx scripts/fix-kusa-quechua-copy.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-cc029-union-ep";

// Lead-line tagline. Under 220 chars for SEO clip.
const TAGLINE =
  "rap in Quechua. very rare. Cusco hip-hop from Nick Hook + Pawkarmayta + Mikongo Ft. Inti.";

// Rewritten liner notes. Each entry is { text, style } where style
// drives the PortableText render — "blockquote" gets serif-italic 22px
// with a left rule, "normal" is the default body paragraph. We use
// blockquote sparingly: the Quechua-rarity headline + the closing
// "now let Inti take us thru the realm" line, both load-bearing.
const BLOCKS: { text: string; style: "normal" | "blockquote" }[] = [
  { text: "KUSA — Quechua for cool, for happy. First single from a 5-track EP recorded in the Sacred Valley.", style: "normal" },

  { text: "Rap in Quechua. Very rare — there's essentially no commercial hip-hop catalog in this language. The lead verse on KUSA is in Quechua from start to finish; the first commercial release to feature a fully Quechua verse from the Cusco region.", style: "blockquote" },

  { text: "Recorded at Pawkarmayta's studio in the Sacred Valley, Peru, over three weeks in early 2026. Calm + Collect CC029, May 2026.", style: "normal" },

  { text: "Inti — young Cusqueño rapper. First commercial release. The Quechua verse is his.", style: "normal" },

  { text: "Mikongo — Cusco legend. Producer, vocalist, scene anchor.", style: "normal" },

  { text: "Pawkarmayta — Cusco-based producer and multi-instrumentalist. The session's home base was his studio.", style: "normal" },

  { text: "Nick Hook — Brooklyn producer. Run The Jewels co-prod on Cu4tro (2022). Fifteen years of records on Calm + Collect. Brought the rig down to Cusco; co-produced the session.", style: "normal" },

  { text: "More coming: QOQEQA's hyper-merengue remix of the Gangsta Boo single, more from the Selvagia sessions, and the rest of the EP rolling out across 2026.", style: "normal" },

  { text: "Credit: Nick Hook + Pawkarmayta + Mikongo Ft. Inti.", style: "normal" },

  { text: "Now let Inti take us thru the realm.", style: "blockquote" },
];

function textToPortableTextBlocks(blocks: typeof BLOCKS) {
  return blocks.map((b) => ({
    _key: randomUUID(),
    _type: "block",
    style: b.style,
    markDefs: [],
    children: [
      {
        _key: randomUUID(),
        _type: "span",
        text: b.text,
        marks: [],
      },
    ],
  }));
}

async function main() {
  await client
    .patch(RELEASE_ID)
    .set({
      tagline: TAGLINE,
      notes: textToPortableTextBlocks(BLOCKS),
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}`);
  console.log(`  tagline → ${TAGLINE}`);
  console.log(`  notes   → ${BLOCKS.length} blocks (Quechua-only framing, 2 blockquoted)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
