/**
 * First-pass bios for the four upcoming records that don't have one yet:
 *   1. Just Nico (Album II)
 *   2. Relationships — 10 Year Deluxe
 *   3. Calm + Collect Compilation
 *   4. Calm + Collect Remix Compilation
 *
 * Strictly fact-based: only what's in the Sanity data + the Jakub folder
 * evidence. No invented sessions, dates, or quotes. Nick edits in Studio.
 *
 * Each one gets a few normal paragraphs + at least one blockquoted line
 * for visual weight (matches the Glove + KUSA treatment).
 *
 * Run: npx tsx scripts/write-upcoming-bios.ts
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

type Block = { text: string; style: "normal" | "blockquote" };

function notesToPortableText(blocks: Block[]) {
  return blocks.map((b) => ({
    _key: randomUUID(),
    _type: "block",
    style: b.style,
    markDefs: [],
    children: [{ _key: randomUUID(), _type: "span", text: b.text, marks: [] }],
  }));
}

// ────────────────────────────────────────────────────────────────────────
// 1. JUST NICO (Album II)
// ────────────────────────────────────────────────────────────────────────
const JUST_NICO: Block[] = [
  {
    text: "The second album. Working title: Just Nico.",
    style: "normal",
  },
  {
    text: "Ten years after Relationships (CC015 · 2017), Nick Hook's second solo LP. Brooklyn + Medellín built into one record.",
    style: "normal",
  },
  {
    text: "Every collaborator. Every era. The masterpiece phase.",
    style: "blockquote",
  },
  {
    text: "Ten tracks. Andres Belloso + Felisa Tambor open the record. Pawmps + Gangsta Boo on track 2 (the album version of 'If The Glove Don't Fit'). Ghetto Living, Apache, La Pardo + Pezcatore, Metricas Frias + Guadalupe, Tulliz + SIIDS + Lrel, Lido Pimienta + Liliana Romero Música, Fatboi Sharif + Cassie Watson Francillon close it out.",
    style: "normal",
  },
  {
    text: "Producer rolodex: Brodinski. Doug Surreal. Kid Kreep. MadStarBase. Chad Hugo. Taso. Spiritual Friendship. Nick Hook across all ten.",
    style: "normal",
  },
  {
    text: "Players: Liliana Romero Música on flute, ocarina, shells, percussion. Adrian Terrazas González on sax. Henry D'Arthenay on guitar. Cassie Watson Francillon on harp. Rubén Jaramillo on tumbadoras, triángulo, guacharaca, castañuelas. Yulian Percs. Eva Peroni on bass. Chucho Llano on keys. Electrogenetic + Byron The Aquarius on synth.",
    style: "normal",
  },
  {
    text: "Mixed by Gareth Jones @ The artLab. Mastered by Joe Laporta @ Sterling Sound.",
    style: "normal",
  },
  {
    text: "Recorded across thespacepit (Brooklyn), The links (New Delhi), Tonala, Medellin Studios, TSP Medellín (Coolto), Pinche Hype, The artLapi, Rio Claro, Hellywood Studio, and IME Escuelas Técnicas.",
    style: "normal",
  },
];

// ────────────────────────────────────────────────────────────────────────
// 2. RELATIONSHIPS — 10 YEAR DELUXE
// ────────────────────────────────────────────────────────────────────────
const RELATIONSHIPS_DELUXE: Block[] = [
  {
    text: "The 2017 record, expanded. Ten years later.",
    style: "normal",
  },
  {
    text: "Original CC015 with bonus material from the same sessions — 'girls in the club' + 'jeremy sample' — pulled from the vault.",
    style: "normal",
  },
  {
    text: "Ten years on, the relationships hold.",
    style: "blockquote",
  },
  {
    text: "Calm + Collect anniversary edition. Full reissue with deluxe extras.",
    style: "normal",
  },
];

// ────────────────────────────────────────────────────────────────────────
// 3. CALM + COLLECT COMPILATION
// ────────────────────────────────────────────────────────────────────────
const CC_COMPILATION: Block[] = [
  {
    text: "The catalog as one record. A curated retrospective of Calm + Collect since 2013.",
    style: "normal",
  },
  {
    text: "Highlights pulled across the imprint's full run — Color Film, Spiritual Friendship, Nick Hook collaborations, the early Hookemon run, the Cubic Zirconia legacy that became Lockhart Dynasty × Calm + Collect.",
    style: "normal",
  },
  {
    text: "Brooklyn → Medellín. Twelve years of records. One sitting.",
    style: "blockquote",
  },
];

// ────────────────────────────────────────────────────────────────────────
// 4. CALM + COLLECT REMIX COMPILATION
// ────────────────────────────────────────────────────────────────────────
const CC_REMIX_COMP: Block[] = [
  {
    text: "Every Calm + Collect record handed to a new producer. Fifteen tracks.",
    style: "normal",
  },
  {
    text: "Old English (DJ Spinn + Nick Hook + Scatta) opens the comp — the unreleased VIP of the 2014 Young Thug + Freddie Gibbs + A$AP Ferg single, finally on the label.",
    style: "normal",
  },
  {
    text: "Remixers: DJ Spinn + Scatta. Salva (on Can't Tell Me Nothing). Egyptrixx (Josephine). Ikonika (Hoes Come Out At Night). Bart Bmore (Take Me High). Big Dope P (Jaco). Cardopusher (How Yall Feeling, How Y'all Feeling). Doc Daneeka (Until You Turn Blue). Jesse Rose + Brillstein (Wurly). Neana (J.A.M.I.T.). Oak City Slums (Peephole). Thee Mike B (Head). Uniique (Tardes De Verano).",
    style: "normal",
  },
  {
    text: "Twelve years of the catalog, handed off and reshaped.",
    style: "blockquote",
  },
];

const RELEASES: { id: string; label: string; blocks: Block[] }[] = [
  { id: "release-nick-hook-album-ii", label: "Just Nico (Album II)", blocks: JUST_NICO },
  { id: "release-relationships-10-year-deluxe", label: "Relationships — 10 Year Deluxe", blocks: RELATIONSHIPS_DELUXE },
  { id: "release-cc-compilation-2026", label: "Calm + Collect Compilation", blocks: CC_COMPILATION },
  { id: "release-cc-remix-compilation-2026", label: "Calm + Collect Remix Compilation", blocks: CC_REMIX_COMP },
];

async function main() {
  for (const r of RELEASES) {
    await client
      .patch(r.id)
      .set({ notes: notesToPortableText(r.blocks) })
      .commit();
    console.log(`✓ ${r.label} → ${r.blocks.length} liner blocks`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
