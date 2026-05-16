/**
 * Append Liliana Romero Música as Flute/Ocarina/Shells on the Glove single.
 *
 * Per Nick's final credits list for the single — matches what's on Just
 * Nico track 2 (Liliana plays the same instruments on the album version
 * of the track too).
 *
 * Run: npx tsx scripts/add-liliana-glove.ts
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
const LILIANA_ID = "artist-liliana-romero-musica";

async function main() {
  // Confirm Liliana artist doc exists (we created it during Just Nico wire-up).
  const exists = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id: LILIANA_ID },
  );
  if (!exists) throw new Error(`${LILIANA_ID} does not exist`);

  // Check if she's already credited on the Glove single — idempotent.
  const release = await client.fetch<{
    credits?: Array<{ role?: string; person?: { _ref?: string } }>;
  }>(`*[_id == $id][0]{ credits }`, { id: RELEASE_ID });
  const alreadyThere = (release.credits ?? []).some(
    (c) =>
      c.person?._ref === LILIANA_ID &&
      (c.role ?? "").toLowerCase().includes("flute"),
  );
  if (alreadyThere) {
    console.log("↳ Liliana already credited on Glove, skipping");
    return;
  }

  await client
    .patch(RELEASE_ID)
    .setIfMissing({ credits: [] })
    .append("credits", [
      {
        _key: randomUUID(),
        _type: "object",
        role: "Flute / Ocarina / Shells",
        person: { _type: "reference", _ref: LILIANA_ID },
      },
    ])
    .commit();
  console.log("✓ added Liliana Romero Música — Flute / Ocarina / Shells");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
