/**
 * Seed script — populates Sanity with the AUTHORITATIVE Calm + Collect catalog
 * from the docx (2025). No off-label releases. No RTJ CU4TRO. No major-label
 * placements.
 *
 * Source of truth: ~/Library/CloudStorage/Dropbox/My Mac (Mac-mini)/Downloads/Calm + Collect Catalog.docx
 *
 * Idempotent — re-running updates by _id, doesn't duplicate.
 *
 * Run:  npx tsx scripts/seed.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";

if (!projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type ArtistSeed = { name: string; city?: string; tagline?: string; bandcampUrl?: string; onLabel?: boolean };
type ReleaseSeed = {
  catalogNumber: string;
  title: string;
  artistNames: string[];
  imprint: "Calm + Collect" | "Calm + Collect Instrumental" | "Calllm" | "Lockhart Dynasty × Calm + Collect" | "Hookemon";
  withdrawn?: boolean;
  coverColor?: string;
};

// Artists referenced anywhere in the catalogue
const ARTISTS: ArtistSeed[] = [
  { name: "Nick Hook", city: "brooklyn · medellín", tagline: "the waviest resident. producer / dj / engineer / founder.", bandcampUrl: "https://nickhook.bandcamp.com", onLabel: true },
  { name: "Spiritual Friendship", city: "new york · london", tagline: "nick hook + gareth jones. drones, beats, nothing judged.", bandcampUrl: "https://spiritualfriendship.bandcamp.com", onLabel: true },
  { name: "Gareth Jones", city: "london · uk", tagline: "producer / engineer. half of spiritual friendship. electrogenetic on his own.", onLabel: true },
  { name: "Quazzy", city: "brooklyn · ny", tagline: "guided meditation + la burbuja.", onLabel: true },
  { name: "Geraldina", tagline: "CC008 · magnetoreception.", onLabel: false },
  { name: "Sinister Dane", city: "st louis · mo", tagline: "the claws of time.", onLabel: true },
  { name: "Superhero Killer", city: "st louis · mo", tagline: "old friends, forever on the label.", onLabel: true },
  { name: "Color Film", tagline: "CC001 · until you turn blue.", onLabel: true },
  { name: "Cubic Zirconia", tagline: "lockhart dynasty × calm + collect.", onLabel: true },
  // Collaborators / featured (not on roster)
  { name: "Gangsta Boo", city: "memphis · tn", tagline: "rip the queen.", onLabel: false },
  { name: "3asic", onLabel: false },
  { name: "Vin Sol", city: "sf", onLabel: false },
  { name: "Matrixxman", city: "sf", onLabel: false },
  { name: "Nehuen", onLabel: false },
  { name: "DJ Earl", city: "chicago", tagline: "teklife. footwork.", onLabel: false },
  { name: "Lao", onLabel: false },
  { name: "Mi$$il", onLabel: false },
  { name: "Fory Five", onLabel: false },
  { name: "Yoga Fire", onLabel: false },
  { name: "Polybiu$", onLabel: false },
  { name: "Taso", city: "chicago", tagline: "teklife. footwork.", onLabel: false },
  { name: "Logo No Logo", onLabel: false },
  { name: "Kid Kreep", onLabel: false },
  { name: "Pawkarmayta", onLabel: false },
  { name: "Inti", onLabel: false },
  { name: "Mikongo", onLabel: false },
  { name: "21 Savage", onLabel: false },
  { name: "Bulletproof Dolphin", onLabel: false },
  { name: "Novelist", city: "london", onLabel: false },
  { name: "EdoHeart", onLabel: false },
  { name: "Tiombe Lockhart", onLabel: false },
];

// CALM + COLLECT main catalogue
const CC_MAIN: ReleaseSeed[] = [
  { catalogNumber: "CC001", title: "Until You Turn Blue", artistNames: ["Color Film"], imprint: "Calm + Collect", coverColor: "#2F6FB3" },
  { catalogNumber: "CC002", title: "Like Water", artistNames: ["Nick Hook"], imprint: "Calm + Collect", coverColor: "#3E8E5A" },
  { catalogNumber: "CC003", title: "Drums", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calm + Collect", coverColor: "#1C1A17" },
  { catalogNumber: "CC004", title: "Peephole", artistNames: ["Nick Hook", "Gangsta Boo"], imprint: "Calm + Collect", coverColor: "#E83A1C" },
  { catalogNumber: "CC005", title: "Need For Speed", artistNames: ["Nick Hook", "3asic"], imprint: "Calm + Collect", coverColor: "#F2B705" },
  { catalogNumber: "CC006", title: "Electrogenetic", artistNames: ["Gareth Jones"], imprint: "Calm + Collect", coverColor: "#4B2E83" },
  { catalogNumber: "CC007", title: "I'm Fresh", artistNames: ["Gangsta Boo", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#9B1B1B" },
  { catalogNumber: "CC008", title: "Magnetoreception", artistNames: ["Geraldina"], imprint: "Calm + Collect", withdrawn: true, coverColor: "#8C8677" },
  { catalogNumber: "CC009", title: "The Claws of Time", artistNames: ["Sinister Dane"], imprint: "Calm + Collect", coverColor: "#0E4B3A" },
  { catalogNumber: "CC010", title: "I Can Feel It EP", artistNames: ["Nick Hook", "Vin Sol", "Matrixxman"], imprint: "Calm + Collect", coverColor: "#2F6FB3" },
  { catalogNumber: "CC011", title: "How Y'all Feeling, Work That Pussy", artistNames: ["Nehuen", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#E2651A" },
  { catalogNumber: "CC012", title: "Collage v.1", artistNames: ["Nick Hook"], imprint: "Calm + Collect", coverColor: "#C9B9E8" },
  { catalogNumber: "CC013", title: "Collage v.1 Remixes", artistNames: ["Nick Hook"], imprint: "Calm + Collect", coverColor: "#4B2E83" },
  { catalogNumber: "CC014", title: "Head", artistNames: ["Nick Hook", "21 Savage", "Bulletproof Dolphin"], imprint: "Calm + Collect", coverColor: "#1C1A17" },
  { catalogNumber: "CC015", title: "Relationships", artistNames: ["Nick Hook"], imprint: "Calm + Collect", coverColor: "#E83A1C" },
  { catalogNumber: "CC016", title: "Can't Tell Me Nothing (+ Remixes)", artistNames: ["Nick Hook", "Novelist"], imprint: "Calm + Collect", coverColor: "#F2C84B" },
  { catalogNumber: "CC017", title: "50 Backwoods", artistNames: ["Nick Hook", "DJ Earl"], imprint: "Calm + Collect", coverColor: "#0E4B3A" },
  { catalogNumber: "CC018", title: "Tardes De Verano", artistNames: ["Nick Hook", "Lao", "Mi$$il"], imprint: "Calm + Collect", coverColor: "#F2B705" },
  { catalogNumber: "CC019", title: "Bluni", artistNames: ["Nick Hook", "Fory Five", "Lao"], imprint: "Calm + Collect", coverColor: "#9B1B1B" },
  { catalogNumber: "CC020", title: "The Crystal", artistNames: ["Nick Hook", "Yoga Fire", "Lao"], imprint: "Calm + Collect", coverColor: "#C9B9E8" },
  { catalogNumber: "CC021", title: "Tardes De Verano (Polybiu$ Remix)", artistNames: ["Nick Hook", "Lao", "Mi$$il", "Polybiu$"], imprint: "Calm + Collect", coverColor: "#E2651A" },
  { catalogNumber: "CC022", title: "Breath You Out and Breath You In", artistNames: ["Superhero Killer"], imprint: "Calm + Collect", coverColor: "#3E8E5A" },
  { catalogNumber: "CC023", title: "iV", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calm + Collect", coverColor: "#4B2E83" },
  { catalogNumber: "CC024", title: "Pranamaya Kosha", artistNames: ["Quazzy", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#0E4B3A" },
  { catalogNumber: "CC025", title: "La Burbuja LP", artistNames: ["Quazzy", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#2F6FB3" },
  { catalogNumber: "CC026", title: "Jungle Juice v.1", artistNames: ["Taso", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#9B1B1B" },
  { catalogNumber: "CC027", title: "What You Gonna Do", artistNames: ["Nick Hook", "Logo No Logo", "Kid Kreep"], imprint: "Calm + Collect", coverColor: "#E83A1C" },
  { catalogNumber: "CC028", title: "Drums 2", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calm + Collect", coverColor: "#1C1A17" },
  { catalogNumber: "CC029", title: "Union EP", artistNames: ["Pawkarmayta", "Inti", "Mikongo", "Nick Hook"], imprint: "Calm + Collect", coverColor: "#F2B705" },
];

// CALM + COLLECT INSTRUMENTAL
// NOTE: only CCINST001 is released. CCINST002–007 are coming but not out yet
// — keeping them commented so re-seeds don't recreate them. Uncomment as released.
const CC_INST: ReleaseSeed[] = [
  { catalogNumber: "CCINST001", title: "Relationships (Instrumentals)", artistNames: ["Nick Hook"], imprint: "Calm + Collect Instrumental", coverColor: "#E83A1C" },
  // { catalogNumber: "CCINST002", title: "Collage v.1 (Instrumentals)", artistNames: ["Nick Hook"], imprint: "Calm + Collect Instrumental", coverColor: "#C9B9E8" },
  // { catalogNumber: "CCINST003", title: "50 Backwoods (Instrumentals)", artistNames: ["Nick Hook", "DJ Earl"], imprint: "Calm + Collect Instrumental", coverColor: "#0E4B3A" },
  // { catalogNumber: "CCINST004", title: "Like Water (Instrumentals)", artistNames: ["Nick Hook"], imprint: "Calm + Collect Instrumental", coverColor: "#3E8E5A" },
  // { catalogNumber: "CCINST005", title: "Okada 800 (Instrumentals)", artistNames: ["Nick Hook", "EdoHeart"], imprint: "Calm + Collect Instrumental", coverColor: "#F2B705" },
  // { catalogNumber: "CCINST006", title: "Spiritual Friendship iV (Instrumentals)", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calm + Collect Instrumental", coverColor: "#4B2E83" },
  // { catalogNumber: "CCINST007", title: "Return 2 Water (Instrumentals)", artistNames: ["Nick Hook"], imprint: "Calm + Collect Instrumental", coverColor: "#2F6FB3" },
];

// CALLLM (ambient / chakra)
const CLM: ReleaseSeed[] = [
  { catalogNumber: "CLM003", title: "Root", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#9B1B1B" },
  { catalogNumber: "CLM004", title: "Sacral", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#E2651A" },
  { catalogNumber: "CLM005", title: "Solar Plexus", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#F2C84B" },
  { catalogNumber: "CLM006", title: "Heart", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#3E8E5A" },
  { catalogNumber: "CLM007", title: "Throat", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#2F6FB3" },
  { catalogNumber: "CLM008", title: "Third Eye", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#4B2E83" },
  { catalogNumber: "CLM009", title: "Crown", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Calllm", coverColor: "#E3D4F2" },
];

// LOCKHART DYNASTY × CALM + COLLECT (Cubic Zirconia catalog)
const LDCC: ReleaseSeed[] = [
  { catalogNumber: "LDCC001", title: "Josephine", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#1C1A17" },
  { catalogNumber: "LDCC002", title: "Black & Blue", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#2F6FB3" },
  { catalogNumber: "LDCC003", title: "Hoes Come Out at Night", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#E83A1C" },
  { catalogNumber: "LDCC004", title: "Follow Your Heart", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#9B1B1B" },
  { catalogNumber: "LDCC005", title: "Take Me High", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#0E4B3A" },
  { catalogNumber: "LDCC006", title: "Darko", artistNames: ["Cubic Zirconia"], imprint: "Lockhart Dynasty × Calm + Collect", coverColor: "#4B2E83" },
];

// HOOKEMON (folded into C+C)
const HOOKEMON: ReleaseSeed[] = [
  { catalogNumber: "hookemon001", title: "Without You", artistNames: ["Nick Hook"], imprint: "Hookemon", coverColor: "#3E8E5A" },
  { catalogNumber: "hookemon002", title: "Spiritual Friendship S/T", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Hookemon", coverColor: "#4B2E83" },
  { catalogNumber: "hookemon003", title: "Friendship (Remixes)", artistNames: ["Spiritual Friendship", "Nick Hook", "Gareth Jones"], imprint: "Hookemon", coverColor: "#C9B9E8" },
];

const ALL_RELEASES: ReleaseSeed[] = [...CC_MAIN, ...CC_INST, ...CLM, ...LDCC, ...HOOKEMON];

async function wipeOldData() {
  console.log("🧹 Wiping old releases + artists from Sanity...");
  const oldReleaseIds = await client.fetch<string[]>(`*[_type == "release"]._id`);
  const oldArtistIds = await client.fetch<string[]>(`*[_type == "artist"]._id`);
  const all = [...oldReleaseIds, ...oldArtistIds];
  if (all.length === 0) {
    console.log("  (nothing to wipe)\n");
    return;
  }
  // Delete in batches; ignore the auto-generated drafts.
  const tx = client.transaction();
  for (const id of all) {
    tx.delete(id);
  }
  await tx.commit({ visibility: "async" });
  console.log(`  removed ${all.length} old documents\n`);
}

async function seed() {
  console.log(`\n🌱 Seeding to project ${projectId}/${dataset}...\n`);
  await wipeOldData();

  const artistRefs: Record<string, string> = {};
  console.log(`Upserting ${ARTISTS.length} artists...`);
  for (const a of ARTISTS) {
    const slug = slugify(a.name);
    const _id = `artist-${slug}`;
    await client.createOrReplace({
      _id,
      _type: "artist",
      name: a.name,
      slug: { _type: "slug", current: slug },
      city: a.city,
      tagline: a.tagline,
      bandcampUrl: a.bandcampUrl,
      onLabel: a.onLabel ?? false,
    });
    artistRefs[a.name] = _id;
    process.stdout.write(".");
  }
  console.log(` ${ARTISTS.length} done\n`);

  console.log(`Upserting ${ALL_RELEASES.length} releases...`);
  for (const r of ALL_RELEASES) {
    const slug = slugify(`${r.catalogNumber}-${r.title}`);
    const _id = `release-${slug}`;
    const missingArtists = r.artistNames.filter((n) => !artistRefs[n]);
    if (missingArtists.length > 0) {
      console.warn(`\n  ⚠️  ${r.catalogNumber} — unknown artist(s): ${missingArtists.join(", ")}`);
    }
    const artists = r.artistNames
      .map((name) => artistRefs[name])
      .filter(Boolean)
      .map((id, i) => ({ _key: `ar-${i}`, _type: "reference", _ref: id }));

    await client.createOrReplace({
      _id,
      _type: "release",
      title: r.title,
      slug: { _type: "slug", current: slug },
      artists,
      catalogNumber: r.catalogNumber,
      coverColor: r.coverColor,
      label: r.imprint,
      withdrawn: r.withdrawn ?? false,
    });
    process.stdout.write(".");
  }
  console.log(` ${ALL_RELEASES.length} done\n`);

  console.log("\n✅ Done.");
  console.log(`   ${CC_MAIN.length} on Calm + Collect main`);
  console.log(`   ${CC_INST.length} on Calm + Collect Instrumental`);
  console.log(`   ${CLM.length} on Calllm (ambient)`);
  console.log(`   ${LDCC.length} on Lockhart Dynasty × Calm + Collect (Cubic Zirconia)`);
  console.log(`   ${HOOKEMON.length} on Hookemon`);
  console.log(`\n   Visit /studio to edit. Visit /calm-collect to see the catalogue.`);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
