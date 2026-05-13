/**
 * Seed the 17 career highlights as Sanity docs.
 *
 * Source: previously hardcoded arrays in app/nick-hook/_components/Highlights.tsx
 * (matched the EPK). Moved to Sanity so Nick can edit each one (add year /
 * city / story / photo / URL) without touching code.
 *
 * Idempotent — uses stable IDs (`highlight-<slug>`). Re-running this is a
 * no-op for existing docs and only inserts missing ones.
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

type Seed = { id: string; name: string; kind: "performance" | "tour" | "experience"; order: number };

const SEEDS: Seed[] = [
  // Performances (column 1)
  { id: "highlight-movement-festival",       name: "Movement Festival",      kind: "performance", order: 1 },
  { id: "highlight-sonar",                   name: "Sónar",                  kind: "performance", order: 2 },
  { id: "highlight-moogfest",                name: "Moogfest",               kind: "performance", order: 3 },
  { id: "highlight-medellin-music-week",     name: "Medellín Music Week",    kind: "performance", order: 4 },
  { id: "highlight-moma-ps1",                name: "MoMA PS1",               kind: "performance", order: 5 },
  { id: "highlight-boiler-room",             name: "Boiler Room",            kind: "performance", order: 6 },
  { id: "highlight-fools-gold-day-off",      name: "Fool's Gold Day Off",    kind: "performance", order: 7 },
  { id: "highlight-hopscotch-festival",      name: "Hopscotch Festival",     kind: "performance", order: 8 },
  { id: "highlight-pitchfork-festival",      name: "Pitchfork Festival",     kind: "performance", order: 9 },
  // Tours (column 2)
  { id: "highlight-rtj-us-2017",             name: "Run The Jewels US 2017", kind: "tour",        order: 1, },
  { id: "highlight-india-asia-2020",         name: "India / Asia 2020",      kind: "tour",        order: 2 },
  { id: "highlight-machinedrum-vapor-city",  name: "Machinedrum · Vapor City", kind: "tour",      order: 3 },
  // Experiences (column 3)
  { id: "highlight-te-mentor",               name: "Mentor · Teenage Engineering", kind: "experience", order: 1 },
  { id: "highlight-rbma-2011",               name: "Red Bull Music Academy 2011",  kind: "experience", order: 2 },
  { id: "highlight-baauer-searching",        name: "Baauer · Searching for Sound", kind: "experience", order: 3 },
  { id: "highlight-converse-moog-week",      name: "Converse + Moog Week",         kind: "experience", order: 4 },
  { id: "highlight-vice-hennessy-rap-monument", name: "Vice + Hennessy · Rap Monument", kind: "experience", order: 5 },
];

(async () => {
  let created = 0, existed = 0;
  for (const s of SEEDS) {
    const existing = await c.fetch<{ _id: string } | null>(`*[_id == $id][0]{ _id }`, { id: s.id });
    if (existing) {
      existed += 1;
      console.log(`↻ exists  ${s.id}`);
      continue;
    }
    await c.create({
      _id: s.id,
      _type: "highlight",
      name: s.name,
      kind: s.kind,
      order: s.order,
      hidden: false,
    } as any);
    created += 1;
    console.log(`+ seeded  ${s.id.padEnd(40)}  ${s.name}`);
  }
  console.log(`\ndone. created=${created}  existed=${existed}\n`);
  console.log(`→ open Sanity Studio · "Career highlight" — fill in year/city/story/photo for each`);
})();
