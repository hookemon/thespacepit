/**
 * Final tracklist for Calm + Collect Remix Compilation (18 tracks, 7
 * unreleased). Per Nick — also tightens the bio framing to mention
 * Old English is the first single off the comp.
 *
 * Unreleased tracks get note: "Previously unreleased" so the page can
 * render an UNRELEASED chip next to them.
 *
 * Run: npx tsx scripts/patch-cc-remix-comp-tracklist.ts
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

const RELEASE_ID = "release-cc-remix-compilation-2026";

// Track index → unreleased flag
const UNRELEASED = new Set([1, 2, 4, 8, 16, 17, 18]);

const TRACKS = [
  "Young Thug Ft. A$AP Ferg + Freddie Gibbs — Old English (DJ Spinn + Nick Hook Remix)",
  "Gangsta Boo Ft. Nick Hook — I'm Fresh (Sinjin Hawke Remix)",
  "Nick Hook Ft. Novelist — Can't Tell Me Nothing (Salva Remix)",
  "Nick Hook Ft. 21 Savage — Head (Thee Mike B Remix)",
  "Nick Hook Ft. Kilo Kish + Todd Edwards — Jaco (Big Dope P Remix)",
  "Nick Hook Ft. Gangsta Boo — Peephole (Oak City Slums Remix)",
  "Nick Hook Ft. The Egyptian Lover — J.A.M.I.T. (Neana Remix)",
  "Nick Hook + Lao Ft. Missil — Tardes De Verano (Uniique Remix)",
  "Cubic Zirconia Ft. Lex — Hoes Come Out At Night (Ikonika Remix)",
  "Spiritual Friendship — Dance (Edit)",
  "Nick Hook Ft. Bernie Worrell + Cmat — Wurly (Jesse Rose + Brillstein Remix)",
  "Cubic Zirconia — Take Me High (Bart Bmore Remix)",
  "Color Film — Until You Turn Blue (Doc Daneeka Remix)",
  "Cubic Zirconia — Josephine (Egyptrixx Remix)",
  "Nehuen + Nick Hook — How Y'all Feeling (Cardopusher E-Rave '93 Mix)",
  "Nick Hook + DJ Earl — Hook Chop (Eliot Lipp 'Windown' Remix)",
  "Spiritual Friendship — An Honest Key Ft. Andy Bell (Adrian Terrazas González Remix)",
  "Nick Hook Ft. DJ Rashad + Chino Moreno — The Infinite Loop (Electrogenetic Remix)",
];

const TRACKLIST = TRACKS.map((title, i) => {
  const idx = i + 1;
  const entry: Record<string, unknown> = {
    _key: randomUUID(),
    _type: "track",
    title,
  };
  if (UNRELEASED.has(idx)) entry.note = "Previously unreleased";
  return entry;
});

const BIO_BLOCKS: { text: string; style: "normal" | "blockquote" }[] = [
  {
    text: "Every Calm + Collect record handed to a new producer. Eighteen tracks. Seven previously unreleased.",
    style: "normal",
  },
  {
    text: "Old English (DJ Spinn + Nick Hook Remix) is the first single off the comp — the unreleased VIP of the 2014 Young Thug + Freddie Gibbs + A$AP Ferg single, finally on the label.",
    style: "blockquote",
  },
  {
    text: "Remixers: DJ Spinn. Sinjin Hawke. Salva. Thee Mike B. Big Dope P. Oak City Slums. Neana. Uniique. Ikonika. Jesse Rose + Brillstein. Bart Bmore. Doc Daneeka. Egyptrixx. Cardopusher. Eliot Lipp. Adrian Terrazas González. Electrogenetic.",
    style: "normal",
  },
  {
    text: "Twelve years of the catalog, handed off and reshaped.",
    style: "blockquote",
  },
];

function bioToPortableText(blocks: typeof BIO_BLOCKS) {
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
      tracklist: TRACKLIST,
      notes: bioToPortableText(BIO_BLOCKS),
      tagline:
        "The full Calm + Collect catalog, remixed. 18 tracks (7 unreleased). Old English first single.",
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}: ${TRACKS.length} tracks (${UNRELEASED.size} unreleased), 4 bio blocks, new tagline`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
