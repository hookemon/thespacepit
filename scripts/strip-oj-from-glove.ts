/**
 * Strip OJ references from the Glove release's tagline + liner notes.
 *
 * Nick called it: the song title carries the cultural reference all on
 * its own. No need to explain "OJ" in the bio — that line was over-
 * doing it. Lineage + the relationship + the dedication remain.
 *
 * Run: npx tsx scripts/strip-oj-from-glove.ts
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

// Cleaned tagline — OJ-verdict reference removed.
const NEW_TAGLINE =
  "Nick Hook + Gangsta Boo + Pawmps. Boo's last session. QOQEQA hyper-merengue remix on the B-side. Dropping August 2026.";

// Cleaned liner notes — the OJ paragraph dropped. Lineage + Sacred Valley
// + mix/master + birthday dedication all stay.
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
    .set({
      tagline: NEW_TAGLINE,
      notes: notesToPortableText(NOTE_BLOCKS),
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}: OJ references stripped`);
  console.log(`  tagline → ${NEW_TAGLINE}`);
  console.log(`  notes   → ${NOTE_BLOCKS.length} blocks (OJ paragraph removed)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
