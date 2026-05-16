/**
 * Glove credits — v2 with Nick's confirmed names:
 *   - Vocals: Gangsta Boo + Pawmps (existing)
 *   - Produced by: Nick Hook + Doug Surreal (Doug confirmed from Just Nico
 *     track 2 — same Boo + Pawmps producer)
 *   - Mixed by: Gareth Jones (@ The artLab)
 *   - Mastered by: Joe Laporta (@ Sterling Sound)
 *   - Remix by: QOQEQA (track 2 only)
 *   - Recorded at: thespacepit (Brooklyn)
 *
 * Also slots the cover image into physicalArtifacts[] as kind: "jacket"
 * so it surfaces in "THE PHYSICAL" room (which sits between bio + watch
 * per Nick's call).
 *
 * Run: npx tsx scripts/wire-glove-credits-v2.ts
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

async function ensureArtist(id: string, name: string, slug: string) {
  const exists = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id },
  );
  if (exists) return;
  await client.createOrReplace({
    _id: id,
    _type: "artist",
    name,
    slug: { _type: "slug", current: slug },
    onLabel: false,
  });
  console.log(`✓ created artist ${id}`);
}

async function main() {
  // Make sure Doug Surreal + Gareth + Joe + QOQEQA artist docs exist.
  await ensureArtist("artist-doug-surreal", "Doug Surreal", "doug-surreal");
  await ensureArtist("artist-gareth-jones", "Gareth Jones", "gareth-jones");
  await ensureArtist("artist-joe-laporta", "Joe Laporta", "joe-laporta");
  await ensureArtist("artist-qoqeqa", "QOQEQA", "qoqeqa");

  // Get the current cover asset _id so we can also slot it as a vinyl
  // jacket physical artifact.
  const release = await client.fetch<{ cover?: { asset: { _ref: string } } }>(
    `*[_id == $id][0]{ cover }`,
    { id: RELEASE_ID },
  );
  const coverAssetRef = release.cover?.asset?._ref;
  if (!coverAssetRef) console.warn("⚠ no cover asset on release");

  const REMIX_TRACK_TITLE = "If The Glove Don't Fit (QOQEQA Hyper-Merengue Remix)";

  const CREDITS = [
    {
      _key: randomUUID(),
      _type: "object",
      role: "Vocals",
      person: { _type: "reference", _ref: "artist-gangsta-boo" },
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Vocals",
      person: { _type: "reference", _ref: "artist-pawmps" },
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Produced by",
      person: { _type: "reference", _ref: "artist-nick-hook" },
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Produced by",
      person: { _type: "reference", _ref: "artist-doug-surreal" },
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Remix by",
      person: { _type: "reference", _ref: "artist-qoqeqa" },
      tracks: [REMIX_TRACK_TITLE],
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Mixed by",
      person: { _type: "reference", _ref: "artist-gareth-jones" },
      instrument: "The artLab",
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Mastered by",
      person: { _type: "reference", _ref: "artist-joe-laporta" },
      instrument: "Sterling Sound",
    },
    {
      _key: randomUUID(),
      _type: "object",
      role: "Recorded at",
      name: "thespacepit",
      instrument: "Brooklyn",
    },
  ];

  const patches: Record<string, unknown> = { credits: CREDITS };

  // Slot the cover as a physical artifact (vinyl jacket).
  if (coverAssetRef) {
    patches.physicalArtifacts = [
      {
        _key: randomUUID(),
        _type: "object",
        kind: "jacket",
        title: "Vinyl jacket",
        note: "Front of the 7\" pressing — OJ verdict callback, Boo's birthday release.",
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: coverAssetRef },
        },
      },
    ];
  }

  await client.patch(RELEASE_ID).set(patches).commit();
  console.log(`✓ ${RELEASE_ID}:`);
  console.log(`  credits → ${CREDITS.length} roles (vocals, prod x2, remix, mix, master, recorded-at)`);
  if (coverAssetRef) console.log(`  physicalArtifacts → 1 (vinyl jacket)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
