/**
 * Big cleanup: delete unrecognized entries, dedupe doubles, refine RTJ4
 * credits to track-specific roles per Nick's notes.
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

// Delete outright — Nick doesn't recognize or doesn't want these.
const DELETE_IDS = [
  "release-discogs-33969366",                  // House Grooves Vol 28
  "release-discogs-22842206",                  // Club June 2017
  "release-discogs-7026522",                   // The Amethyst Tape (dupe + unknown)
  "release-ext-the-amethyst-tape-2015",        // The Amethyst Tape (dupe + unknown)
  "release-discogs-5215755",                   // Hot Natured Alternate States
  "release-discogs-14269707",                  // FACT Mix 712

  // Dupe removals — keeping the better-edited version
  "release-discogs-13996460",                  // Rap Monument dupe (keep release-ext-rap-monument-2015)
  "release-discogs-9533457",                   // Peacemaker dupe (keep release-ext-peacemaker-2014)
  "release-discogs-312902",                    // Let The Children Techno dupe
  "release-discogs-1749989",                   // RTJ4 dupe
  "release-ext-rtj4",                          // RTJ4 second dupe
  "release-discogs-1966807",                   // Ju$T dupe
  "release-discogs-14985427",                  // Yankee And The Brave dupe
];

async function deleteAll() {
  console.log(`🗑  Deleting ${DELETE_IDS.length} entries...`);
  for (const id of DELETE_IDS) {
    try {
      const r = await client.fetch<{ title?: string } | null>(`*[_id == $id][0]{ title }`, { id });
      await client.delete(id);
      console.log(`  - ${id}  ${r?.title ?? ""}`);
    } catch (err) {
      console.log(`  · ${id} (skipped: ${(err as Error).message.slice(0, 40)})`);
    }
  }
}

// Replace RTJ4's generic credits with track-specific ones per Nick's notes.
async function rtj4Credits() {
  console.log("\n📀 Updating RTJ4 credits...");
  const rtj4Id = "release-ext-run-the-jewels-4-2020";
  const r = await client.fetch<{ _id: string; credits?: { _key?: string; role?: string; person?: { _ref?: string } }[] } | null>(
    `*[_id == $id][0]{ _id, credits }`, { id: rtj4Id }
  );
  if (!r) { console.log("  ⚠ RTJ4 not found"); return; }

  const nick = await client.fetch<{ _id: string }>(`*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`);
  if (!nick) return;

  // Strip Nick's generic credits, keep credits for other people.
  const cleaned = (r.credits ?? []).filter((c) => c.person?._ref !== nick._id);

  // Add track-specific credits.
  const newCredits = [
    { role: "Co-produced (Goonies vs E.T.)", _key: `c-nick-rtj4-goonies` },
    { role: "Engineer (Yankee And The Brave)", _key: `c-nick-rtj4-yankee` },
    { role: "Engineer (Oh La La)", _key: `c-nick-rtj4-oh-la-la` },
  ];
  for (const c of newCredits) {
    cleaned.push({
      ...c,
      role: c.role,
      person: { _type: "reference", _ref: nick._id } as never,
    });
  }

  await client.patch(rtj4Id).set({ credits: cleaned }).commit({ autoGenerateArrayKeys: true });
  console.log(`  ✓ Set ${newCredits.length} track-specific credits on RTJ4`);
}

async function main() {
  await deleteAll();
  await rtj4Credits();
  console.log("\n✅ done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
