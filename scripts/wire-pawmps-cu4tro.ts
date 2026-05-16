/**
 * Wire Pawmps into RTJ CU4TRO:
 *   1. Update the "caminando en la nieve" track title to include Pawmps
 *      in the featured artists line + add her to features[]
 *   2. Add a release-level credit (Vocals · scoped to that one track) so
 *      Pawmps' artist page auto-pulls CU4TRO into her "appears on" rail
 *
 * Lineage thread: Pawmps did the Gangsta Boo hook from "Walking in the
 * Snow" on this CU4TRO cumbia rework (2022), and is now co-billed with
 * Gangsta Boo herself on "If The Glove Don't Fit" (2026).
 *
 * Run: npx tsx scripts/wire-pawmps-cu4tro.ts
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

async function main() {
  const cu4troId = await client.fetch<string>(
    `*[slug.current == 'rtj-cu4tro-2023'][0]._id`,
  );
  if (!cu4troId) throw new Error("CU4TRO not found");
  console.log("CU4TRO id:", cu4troId);

  const cu4tro = await client.fetch<{
    tracklist?: Array<{ _key: string; title?: string; feature?: string; features?: string[] }>;
    credits?: Array<{ _key?: string; role?: string; name?: string; person?: { _ref?: string } }>;
  }>(
    `*[_id == $id][0]{ tracklist, credits }`,
    { id: cu4troId },
  );

  const tracks = cu4tro.tracklist ?? [];
  const caminandoIdx = tracks.findIndex((t) => (t.title ?? "").toLowerCase().includes("caminando"));
  if (caminandoIdx < 0) throw new Error("caminando track not found");

  const oldTitle = tracks[caminandoIdx].title ?? "";
  const newTitle = "caminando en la nieve Ft. Akapellah, Apache & Pawmps (Orestes Gomez & Nick Hook's Version)";
  const newFeatures = ["Akapellah", "Apache", "Pawmps"];

  // Patch the track in-place using array element patch.
  await client
    .patch(cu4troId)
    .set({
      [`tracklist[${caminandoIdx}].title`]: newTitle,
      [`tracklist[${caminandoIdx}].features`]: newFeatures,
    })
    .commit();
  console.log(`✓ caminando track`);
  console.log(`  old: ${oldTitle}`);
  console.log(`  new: ${newTitle}`);

  // Check if Pawmps is already a credit; skip if so.
  const existingCredits = cu4tro.credits ?? [];
  const alreadyCredited = existingCredits.some(
    (c) => c.person?._ref === "artist-pawmps" && (c.role === "Featured artist" || c.role === "Vocals"),
  );
  if (alreadyCredited) {
    console.log("  ↳ Pawmps credit already exists on CU4TRO, skipping");
  } else {
    await client
      .patch(cu4troId)
      .setIfMissing({ credits: [] })
      .append("credits", [
        {
          _key: randomUUID(),
          _type: "object",
          role: "Featured artist",
          person: { _type: "reference", _ref: "artist-pawmps" },
          // Scope the credit to the caminando track so it doesn't show as
          // album-wide on the CU4TRO credits room.
          tracks: ["caminando en la nieve Ft. Akapellah, Apache & Pawmps (Orestes Gomez & Nick Hook's Version)"],
        },
      ])
      .commit();
    console.log(`✓ added Pawmps as Featured artist credit on CU4TRO (scoped to caminando)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
