/**
 * Bring the Rap Monument release to life:
 *  · attach the official Noisey YouTube playlist (38 videos)
 *  · add the Nip Thug / Stank LA NYC story to the notes field
 *
 * Idempotent — patches the existing release-ext-rap-monument-2015 doc.
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

// Plain-string paragraphs → Portable Text blocks for the `notes` field.
function portableText(paragraphs: string[]) {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `p${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text: p, marks: [] }],
  }));
}

const STORY = [
  "Three cities. Thirty rappers. One track. Hudson Mohawke (Nip Thug to those who know) and Noisey rounded up a roster — LA, Atlanta, NYC — for a single connected verse that ran 35+ minutes deep.",
  "Nick mixed the whole monument. Stank LA. Stank ATL. Stank NYC. Each city's chunk has its own pocket — different rooms, different chains, different attitudes — but the through-line is the wave Hud built underneath. Held together at the desk.",
  "Released March 2015 on Noisey. Every verse got its own video, every video lives in the playlist below — pull up to the world.",
];

async function main() {
  // The release was created by migrate-external-credits.ts — find it by slug.
  const release = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "release" && slug.current == "rap-monument-2015"][0]{ _id, title }`
  );
  if (!release) {
    console.error("rap-monument-2015 release not found — run migrate-external-credits.ts first");
    process.exit(1);
  }

  await client
    .patch(release._id)
    .set({
      // Nick's own curated playlist on @thespacepit / @nickhook channel.
      youtubePlaylistId: "PLMXEKDUSbulN4ZNzu3fGM3odbhTvShkdF",
      tagline: "Noisey · Hudson Mohawke (Nip Thug) · 30 rappers across 3 cities",
      notes: portableText(STORY),
    })
    .commit({ autoGenerateArrayKeys: true });

  console.log(`✓ patched ${release.title}`);
  console.log(`  + youtubePlaylistId  PLMXEKDUSbulN4ZNzu3fGM3odbhTvShkdF (36 videos · Nick's playlist)`);
  console.log(`  + tagline             Noisey · Hudson Mohawke (Nip Thug) · 30 rappers across 3 cities`);
  console.log(`  + notes               ${STORY.length} paragraphs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
