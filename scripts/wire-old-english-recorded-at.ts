/* eslint-disable no-console */
/**
 * Make "Recorded at" credits clickable on the Old English page (and the
 * pattern is reusable across the catalog after this lands).
 *
 *   1. Create stub `studio` docs for Stankonia + Salva Studio (thespacepit
 *      already exists). External studios — slug only, name + city. Nick can
 *      flesh them out in Studio later.
 *   2. Patch Old English credits so the location names are clean (no
 *      " · City" suffix) — the city moves into `instrument` so the renderer
 *      can show it as a small caption next to the link. The GROQ join in
 *      getReleaseBySlug matches `name` against studio docs case-insensitively.
 *
 * Run: npx tsx scripts/wire-old-english-recorded-at.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-old-english-spinn-hook-remix";

async function main() {
  // 1. Stub studio docs
  await client.createIfNotExists({
    _id: "studio-stankonia",
    _type: "studio",
    name: "Stankonia",
    slug: { _type: "slug", current: "stankonia" },
    city: "Atlanta",
    notes: "Outkast's studio. Where the original Old English vocals went down (Young Thug + Freddie Gibbs + A$AP Ferg, 2014).",
  });
  console.log("✓ studio: Stankonia");

  await client.createIfNotExists({
    _id: "studio-salva",
    _type: "studio",
    name: "Salva Studio",
    slug: { _type: "slug", current: "salva-studio" },
    notes: "Salva's room. Salva + Nick Hook tracked the original Old English beat here in 2014.",
  });
  console.log("✓ studio: Salva Studio");

  // 2. Re-patch credits with clean studio names + city in instrument
  const credits = [
    { _key: "cr-vox-yt",     role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-young-thug" } },
    { _key: "cr-vox-fg",     role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-freddie-gibbs" } },
    { _key: "cr-vox-ferg",   role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-a-ap-ferg" } },
    { _key: "cr-prod-salva", role: "Produced by",  person: { _type: "reference", _ref: "artist-ext-salva" } },
    { _key: "cr-prod-nick",  role: "Produced by",  person: { _type: "reference", _ref: "artist-nick-hook" } },
    { _key: "cr-rmx-spinn",  role: "Remix by",     person: { _type: "reference", _ref: "artist-ext-dj-spinn" } },
    { _key: "cr-rmx-nick",   role: "Remix by",     person: { _type: "reference", _ref: "artist-nick-hook" } },
    { _key: "cr-rmx-scatta", role: "Remix by",     person: { _type: "reference", _ref: "artist-ext-scatta" } },
    { _key: "cr-master-joe", role: "Mastered by",  person: { _type: "reference", _ref: "artist-stub-joe-laporta" } },
    { _key: "cr-rec-stank",    role: "Recorded at", name: "Stankonia",    instrument: "Atlanta" },
    { _key: "cr-rec-spacepit", role: "Recorded at", name: "thespacepit",   instrument: "Brooklyn" },
    { _key: "cr-rec-salva",    role: "Recorded at", name: "Salva Studio" },
  ];

  await client.patch(RELEASE_ID).set({ credits }).commit();
  console.log("✓ Old English: credits repatched with clean studio names");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
