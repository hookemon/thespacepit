/**
 * Build the GTA world:
 *  - Add the missing GTA Online Original Score release (DāM-FunK + Nick Hook).
 *  - Create the project-grand-theft-auto era doc with story + members + releases.
 *
 * Idempotent.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const NEW_RELEASE_ID = "release-ext-dam-funk-gta-online-original-score";
const NEW_RELEASE_SLUG = "dam-funk-presents-gta-online-original-score";
const PROJECT_ID = "project-grand-theft-auto";

function pt(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `gta-p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `gta-s${i}`, text: p, marks: [] }],
  }));
}

const STORY = [
  "The work that ended up inside Grand Theft Auto. Casino Heist Online Mission was the first piece — original score for the heist mission inside GTA Online (Rockstar Games), 2020. Then Dam-Funk reached for some of the same world for his official GTA score project on Mass Appeal in 2023, and reworked it twice — once for the regular Original Score and once for the Online Original Score. The Diamond Casino Heist track is what landed.",
  "Producers cross paths with games more than people think — when a game ships scored music to tens of millions of homes, the producer's invisible. This page makes the GTA chapter visible.",
];

(async () => {
  console.log("\n🎮 Building the GTA world\n");

  // 1. Add the missing release
  console.log("→ creating release-ext-dam-funk-gta-online-original-score...");
  await c.createIfNotExists({
    _id: NEW_RELEASE_ID,
    _type: "release",
    title: "DāM-FunK Presents The Music of Grand Theft Auto Online Original Score",
    slug: { _type: "slug", current: NEW_RELEASE_SLUG },
    year: 2023,
    label: "Other",
    artists: [
      { _type: "reference", _ref: "artist-ext-dam-funk-nick-hook", _key: "a-1" },
    ],
    tracklist: [
      { _key: "tr-0", title: "The Diamond Casino Heist", feature: "Nick Hook" },
    ],
    credits: [
      { _key: "cr-0", role: "production", person: { _type: "reference", _ref: "artist-nick-hook" } },
    ],
  });
  // Ensure the release is enriched on re-runs.
  await c.patch(NEW_RELEASE_ID).set({
    year: 2023,
    label: "Other",
  }).commit();
  console.log("   ✓ release in place");

  // 2. Create the GTA project (era) doc
  console.log("\n→ creating project-grand-theft-auto era page...");
  await c.createIfNotExists({
    _id: PROJECT_ID,
    _type: "project",
    name: "Grand Theft Auto",
    slug: { _type: "slug", current: "grand-theft-auto" },
    kind: "score",
    yearStart: 2020,
    yearEnd: 2023,
    tagline: "Rockstar Games · the work inside the game",
    color: "#1a472a",
  });
  // Wire story + members + releases (always — these are the live fields).
  await c.patch(PROJECT_ID).set({
    story: pt(STORY),
    members: [
      { _type: "reference", _ref: "artist-nick-hook", _key: "m-nick" },
      // Dam-Funk — the merged collab artist doc the sync created.
      { _type: "reference", _ref: "artist-ext-dam-funk-nick-hook", _key: "m-dam" },
    ],
    releases: [
      { _type: "reference", _ref: "release-ext-casino-heist-online-mission", _key: "r-1" },
      { _type: "reference", _ref: "release-ext-dam-funk-presents-the-music-of-grand-theft-auto-original-score", _key: "r-2" },
      { _type: "reference", _ref: NEW_RELEASE_ID, _key: "r-3" },
    ],
  }).commit();
  console.log("   ✓ project wired (3 releases linked)");

  console.log("\n✅ done — refresh /eras/grand-theft-auto\n");
})();
