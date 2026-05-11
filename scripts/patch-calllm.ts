/**
 * Wire the Calllm sub-label era page up:
 *  - Link the 7 chakra releases (CLM003 → CLM009) to the project's releases.
 *  - Add Spiritual Friendship + Nick Hook + Gareth Jones as members.
 *  - Expand the story slightly to close the loop with MWC (Gareth/Nick origin).
 *  - Ensure artist-gareth-jones exists (create stub if missing).
 *
 * Idempotent.
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

function portableText(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `clm-p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `clm-s${i}`, text: p, marks: [] }],
  }));
}

const RELEASE_IDS = [
  "release-clm003-root",
  "release-clm004-sacral",
  "release-clm005-solar-plexus",
  "release-clm006-heart",
  "release-clm007-throat",
  "release-clm008-third-eye",
  "release-clm009-crown",
];

const STORY: string[] = [
  "Calm + Collect's ambient and meditative wing. The full chakra series — seven drone records by Spiritual Friendship, Root through Crown.",
  "Scored to chakra-corresponding keys: Root in C, Sacral in D, Solar Plexus in E, Heart in F♯, Throat in G, Third Eye in A, Crown in B. Released alongside live watercolor + guided meditation events.",
  "Spiritual Friendship is Nick Hook + Gareth Jones — the long-running duo whose relationship started two decades earlier when Gareth mixed the Men, Women & Children record. The chakra series is what that conversation became.",
  "Catalog: CLM003 through CLM009.",
];

(async () => {
  console.log("\n🌬  Patching Calllm ambient sub-label\n");

  console.log("→ ensuring artist-gareth-jones exists...");
  const existing = await client.fetch(`*[_id == "artist-gareth-jones"][0]{_id}`);
  if (!existing) {
    await client.create({
      _id: "artist-gareth-jones",
      _type: "artist",
      name: "Gareth Jones",
      slug: { _type: "slug", current: "gareth-jones" },
      tagline: "half of spiritual friendship with nick. mixed the men women & children major-label record — that's where it started.",
      onLabel: false,
    });
    console.log("   ✓ created");
  } else {
    console.log("   ✓ already exists, skipping");
  }

  console.log("\n→ patching project-calllm-ambient-sub-label...");
  await client
    .patch("project-calllm-ambient-sub-label")
    .set({
      story: portableText(STORY),
      members: [
        { _type: "reference", _ref: "artist-spiritual-friendship", _key: "m-sf" },
        { _type: "reference", _ref: "artist-nick-hook", _key: "m-nick" },
        { _type: "reference", _ref: "artist-gareth-jones", _key: "m-gareth" },
      ],
      releases: RELEASE_IDS.map((id) => ({
        _type: "reference",
        _ref: id,
        _key: `rel-${id}`,
      })),
    })
    .commit();
  console.log(`   ✓ story (4 paragraphs) + 3 members + 7 releases linked`);

  console.log("\n✅ done — refresh /eras/calllm-ambient-sub-label\n");
})();
