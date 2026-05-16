/**
 * Restore the Remix Comp tracklist to Nick's exact format:
 *   "Artist Credit - Track Title (Remixer)"
 *
 * I previously flipped this to "Track Title — Artist Credit (Remixer)"
 * which was wrong. This rewrite uses Nick's verbatim names + order,
 * including the new sequencing (Head at #3, Can't Tell Me Nothing at #4).
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

// 1-indexed unreleased flags per Nick's earlier message
// (1, 2, 3, 8, 16, 17, 18 = 7 unreleased given the new order).
const UNRELEASED = new Set([1, 2, 3, 8, 16, 17, 18]);

const TRACKS = [
  "Young Thug Ft. A$AP Ferg + Freddie Gibbs - Old English (DJ Spinn + Nick Hook Remix)",
  "Gangsta Boo Ft. Nick Hook - I'm Fresh (Sinjin Hawke Remix)",
  "Nick Hook Ft. 21 Savage - Head (Thee Mike B Remix)",
  "Nick Hook Ft. Novelist - Can't Tell Me Nothing (Salva Remix)",
  "Nick Hook Ft. Kilo Kish + Todd Edwards - Jaco (Big Dope P Remix)",
  "Nick Hook Ft. Gangsta Boo - Peephole (Oak City Slums Remix)",
  "Nick Hook Ft. The Egyptian Lover (Neana Remix)",
  "Nick Hook + Lao Ft. Missil - Tardes De Verano (Uniique Remix)",
  "Cubic Zirconia Ft. Lex - Hoes Come Out At Night (Ikonika Remix)",
  "Spiritual Friendship - Dance (Edit)",
  "Nick Hook Ft. Bernie Worrell + Cmat - Wurly (Jesse Rose + Brillstein Remix)",
  "Cubic Zirconia - Take Me High (Bart Bmore Remix)",
  "Color Film - Until You Turn Blue (Doc Daneeka Remix)",
  "Cubic Zirconia - Josephine (Egyptrixx Remix)",
  "Nehuen + Nick Hook - How Y'all Feeling (Cardopusher E-Rave '93 Mix)",
  "Nick Hook + DJ Earl - Hook Chop - Eliot Lipp",
  "Spiritual Friendship - An Honest Key Ft. Andy Bell (Adrian Terrazas González Remix)",
  "Nick Hook Ft. DJ Rashad + Chino Moreno - The Infinite Loop (Electrogenetic Remix)",
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

async function main() {
  await client
    .patch(RELEASE_ID)
    .set({ tracklist: TRACKLIST })
    .commit();
  console.log(`✓ tracklist restored — ${TRACKS.length} tracks, ${UNRELEASED.size} unreleased`);
  console.log(`  format: "Artist Credit - Track Title (Remixer)" (your exact format)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
