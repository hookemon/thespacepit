/**
 * Lock in the Glove release as a SOLID pitch-ready page:
 *   - status: upcoming → dropping (DROPPING badge + private-listening framing)
 *   - releaseDate: 2026-08-07 (Boo's birthday — Aug 7, 1979)
 *   - tracklist: durations + feature credits
 *   - credits: vocals (Boo + Pawmps), produced by Nick Hook, recorded at
 *     thespacepit (Brooklyn). Mix/master left as TBD until Nick names them.
 *   - notes: expanded liner notes telling the OJ-callback + the Pawmps
 *     lineage thread (Walking In The Snow → CU4TRO Caminando → now sharing
 *     a record WITH Boo herself) + the QOQEQA Peru thread
 *
 * Run: npx tsx scripts/solidify-glove-release.ts
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

// ── liner notes ──────────────────────────────────────────────────────────
// Each entry is { text, style } where style drives the PortableText render
// — "blockquote" gets the serif-italic 22px treatment for the load-bearing
// lines (the OJ callback + the Aug 7 dedication).
const NOTE_BLOCKS: { text: string; style: "normal" | "blockquote" }[] = [
  {
    text: "Nick Hook + Gangsta Boo + Pawmps. Two versions on one record — the original + the QOQEQA hyper-merengue remix.",
    style: "normal",
  },
  {
    text: "If the glove don't fit. The OJ-trial callback as a hook on its own — that line is in every American head, and now it's a song.",
    style: "blockquote",
  },
  {
    text: "Pawmps came up to the record through Run The Jewels CU4TRO (2022) — she handled the Boo hook from 'Walking In The Snow' on the Caminando remix. Now she's on a record WITH Boo herself. The lineage closes the loop.",
    style: "normal",
  },
  {
    text: "QOQEQA's remix on the B-side runs hyper-merengue — same Peru / cumbia-merengue energy threading through KUSA and the Selvagia sessions. The label's Latin-American spine.",
    style: "normal",
  },
  {
    text: "Recorded at thespacepit in Brooklyn. Producer: Nick Hook. Vocals: Gangsta Boo + Pawmps.",
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

// ── tracklist with durations + features ──────────────────────────────────
const TRACKLIST = [
  {
    _key: randomUUID(),
    _type: "track",
    title: "If The Glove Don't Fit",
    duration: "3:09",
    features: ["Gangsta Boo", "Pawmps"],
  },
  {
    _key: randomUUID(),
    _type: "track",
    title: "If The Glove Don't Fit (QOQEQA Hyper-Merengue Remix)",
    duration: "3:30",
    features: ["Gangsta Boo", "Pawmps"],
    remixer: "QOQEQA",
  },
];

// ── credits ──────────────────────────────────────────────────────────────
// Conservative — verified facts only. Mix/master/cover-art-designer left
// off; can be added via Studio when names are confirmed.
const CREDITS = [
  {
    _key: randomUUID(),
    _type: "object",
    role: "Vocals",
    person: { _type: "reference", _ref: "artist-gangsta-boo" },
  },
  {
    _key: randomUUID(),
    _type: "object",
    role: "Vocals",
    person: { _type: "reference", _ref: "artist-pawmps" },
  },
  {
    _key: randomUUID(),
    _type: "object",
    role: "Produced by",
    person: { _type: "reference", _ref: "artist-nick-hook" },
  },
  {
    _key: randomUUID(),
    _type: "object",
    role: "Remix by",
    name: "QOQEQA",
    tracks: ["If The Glove Don't Fit (QOQEQA Hyper-Merengue Remix)"],
  },
  {
    _key: randomUUID(),
    _type: "object",
    role: "Recorded at",
    name: "thespacepit",
    instrument: "Brooklyn",
  },
];

async function main() {
  await client
    .patch(RELEASE_ID)
    .set({
      status: "dropping",
      releaseDate: "2026-08-07",
      year: 2026,
      tracklist: TRACKLIST,
      credits: CREDITS,
      notes: notesToPortableText(NOTE_BLOCKS),
    })
    .commit();
  console.log(`✓ ${RELEASE_ID} solidified:`);
  console.log(`  status   → dropping (DROPPING badge active)`);
  console.log(`  date     → 2026-08-07 (Boo's birthday)`);
  console.log(`  tracks   → ${TRACKLIST.length} with durations + features`);
  console.log(`  credits  → ${CREDITS.length} (vocals, prod, remix, recorded-at)`);
  console.log(`  notes    → ${NOTE_BLOCKS.length} blocks (2 blockquoted)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
