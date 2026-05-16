/**
 * Glove liner notes — final draft.
 *
 * Per Nick: the lineage IS the story.
 *
 *   1. Walking In The Snow (RTJ4 · 2020) — RTJ Ft. Gangsta Boo
 *   2. caminando en la nieve (RTJ CU4TRO · 2022) — RTJ Ft. Pawmps, prod
 *      Nick Hook + Orestes Gomez (Pawmps recreated Boo's hook in cumbia)
 *   3. If The Glove Don't Fit (2026) — Pawmps + Boo + Hook
 *      → full circle. the last session with Boo.
 *
 * Also: strip the KUSA + Selvagia name-drops from the QOQEQA paragraph
 * and lean into Sacred Valley / Peru energy without the specific record
 * references (those have their own pages).
 *
 * Run: npx tsx scripts/rewrite-glove-liner-notes.ts
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

const RELEASE_ID = "release-nick-hook-boo-pawmps-glove";

const NOTE_BLOCKS: { text: string; style: "normal" | "blockquote" }[] = [
  {
    text: "Three records. One lineage.",
    style: "normal",
  },
  {
    text: "Walking In The Snow — RTJ4, 2020. Gangsta Boo on the hook.",
    style: "normal",
  },
  {
    text: "caminando en la nieve — RTJ CU4TRO, 2022. Pawmps recreated Boo's hook in cumbia. Co-produced by Nick Hook + Orestes Gomez.",
    style: "normal",
  },
  {
    text: "If The Glove Don't Fit — 2026. Pawmps + Boo + Hook, on one record.",
    style: "normal",
  },
  {
    text: "Full circle. The last session with Boo.",
    style: "blockquote",
  },
  {
    text: "If the glove don't fit. The OJ-trial callback as a hook on its own — that line is in every American head, and now it's a song.",
    style: "normal",
  },
  {
    text: "Produced by Doug Surreal + Nick Hook. Liliana Romero Música on flute, ocarina, and shells — Sacred Valley energy carried into Brooklyn.",
    style: "normal",
  },
  {
    text: "QOQEQA flips the B-side into hyper-merengue. Lima-based, Afro-Peruvian, Andean rhythm pulled through electronic textures — the Peru thread that runs the label's 2026 slate.",
    style: "normal",
  },
  {
    text: "Mixed by Gareth Jones @ The artLab. Mastered by Joe Laporta @ Sterling Sound. Recorded at thespacepit, Brooklyn.",
    style: "normal",
  },
  {
    text: "Dropping August 7, 2026 — what would have been Boo's 47th birthday. For her.",
    style: "blockquote",
  },
];

function notesToPortableText(blocks: typeof NOTE_BLOCKS) {
  return blocks.map((b) => ({
    _key: randomUUID(),
    _type: "block",
    style: b.style,
    markDefs: [],
    children: [{ _key: randomUUID(), _type: "span", text: b.text, marks: [] }],
  }));
}

async function main() {
  await client
    .patch(RELEASE_ID)
    .set({ notes: notesToPortableText(NOTE_BLOCKS) })
    .commit();
  console.log(`✓ ${RELEASE_ID}: rewrote ${NOTE_BLOCKS.length} liner blocks`);
  console.log(`  lineage arc explicit; KUSA/Selvagia stripped; Sacred Valley energy preserved`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
