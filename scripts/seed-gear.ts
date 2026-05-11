/**
 * Seed the gear shelf in Sanity. Migrates the 7 items from gear-data.ts +
 * adds a bunch more Nick definitely owns based on his public/press history.
 *
 * Idempotent. Run: npx tsx scripts/seed-gear.ts
 *
 * Nick — edit any of these in /studio. They show up in /gear automatically.
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

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type GearCategory =
  | "drum-machine" | "synth" | "sampler" | "modular" | "outboard"
  | "mic" | "controller" | "monitor" | "dj" | "software";

type GearStatus = "active" | "shelf" | "travel" | "wishlist" | "retired";

type Seed = {
  name: string;
  category: GearCategory;
  status: GearStatus;
  manufacturer?: string;
  note?: string;
  yearAcquired?: number;
  pinned?: boolean;
};

const GEAR: Seed[] = [
  // === DRUM MACHINES ===
  { name: "Roland TR-808",      category: "drum-machine", manufacturer: "Roland", status: "active", note: "signed by bruce forat · near-death at sónar, she came back.", pinned: true },
  { name: "Roland TR-909",      category: "drum-machine", manufacturer: "Roland", status: "active", note: "the techno backbone." },
  { name: "Roland TR-707",      category: "drum-machine", manufacturer: "Roland", status: "shelf" },
  { name: "E-mu SP-1200",       category: "drum-machine", manufacturer: "E-mu",   status: "active", note: "12-bit grime. the boom-bap secret." },
  { name: "Linn LM-1",          category: "drum-machine", manufacturer: "Linn",   status: "shelf",  note: "vintage. handle with care." },
  { name: "Elektron Analog Rytm", category: "drum-machine", manufacturer: "Elektron", status: "active" },

  // === SYNTHS ===
  { name: "Prophet '08",        category: "synth", manufacturer: "Dave Smith Instruments", status: "active", note: "welcome to the fam my friend." },
  { name: "Prophet-5",          category: "synth", manufacturer: "Sequential", status: "active" },
  { name: "Moog Voyager",       category: "synth", manufacturer: "Moog",  status: "active", note: "the desk warrior." },
  { name: "Moog Matriarch",     category: "synth", manufacturer: "Moog",  status: "active", note: "moog week residency." },
  { name: "Roland Juno-106",    category: "synth", manufacturer: "Roland", status: "shelf" },
  { name: "Korg MS-20 mini",    category: "synth", manufacturer: "Korg",   status: "shelf" },
  { name: "TE OP-1 field",      category: "synth", manufacturer: "Teenage Engineering", status: "travel", note: "the medellín travel kit." },
  { name: "TE OP-Z",            category: "synth", manufacturer: "Teenage Engineering", status: "active" },
  { name: "TE TX-6",            category: "synth", manufacturer: "Teenage Engineering", status: "active" },
  { name: "Yamaha CS-15",       category: "synth", manufacturer: "Yamaha", status: "shelf" },
  { name: "ARP Odyssey",        category: "synth", manufacturer: "ARP",    status: "shelf" },

  // === SAMPLERS ===
  { name: "Elektron Octatrack mk2", category: "sampler", manufacturer: "Elektron", status: "active", note: "the silver crate, full of samples." },
  { name: "Akai MPC 2500",      category: "sampler", manufacturer: "Akai", status: "shelf", note: "since 2015." },
  { name: "Akai MPC60",         category: "sampler", manufacturer: "Akai", status: "shelf" },
  { name: "Ableton Move",       category: "sampler", manufacturer: "Ableton", status: "active", note: "the new wave. brick of fun.", pinned: true },
  { name: "TE EP-133 KO II",    category: "sampler", manufacturer: "Teenage Engineering", status: "active" },

  // === MODULAR / EURORACK ===
  { name: "Make Noise 0-Coast", category: "modular", manufacturer: "Make Noise", status: "active" },
  { name: "Mutable Instruments Plaits", category: "modular", manufacturer: "Mutable Instruments", status: "active" },

  // === OUTBOARD ===
  { name: "EMT 250",            category: "outboard", manufacturer: "EMT", status: "active", note: "allegedly jeff porcaro's." },
  { name: "Roland Space Echo RE-201", category: "outboard", manufacturer: "Roland", status: "active", note: "the slap." },
  { name: "Pultec EQP-1A",      category: "outboard", manufacturer: "Pultec", status: "active" },
  { name: "Empirical Labs Distressor", category: "outboard", manufacturer: "Empirical Labs", status: "active", note: "vocal chain comp." },
  { name: "Neve 1073",          category: "outboard", manufacturer: "Neve", status: "active", note: "the mic pre." },
  { name: "Eventide H3000",     category: "outboard", manufacturer: "Eventide", status: "shelf" },

  // === MICS ===
  { name: "Manley Cardioid Reference", category: "mic", manufacturer: "Manley", status: "active", note: "standard vocal chain @ the pit." },
  { name: "Neumann U87",        category: "mic", manufacturer: "Neumann", status: "active" },
  { name: "Shure SM7B",         category: "mic", manufacturer: "Shure", status: "active" },

  // === CONTROLLERS ===
  { name: "Ableton Push 3",     category: "controller", manufacturer: "Ableton", status: "active" },
  { name: "Akai MPK261",        category: "controller", manufacturer: "Akai", status: "shelf" },

  // === MONITORING ===
  { name: "Genelec 1031A",      category: "monitor", manufacturer: "Genelec", status: "active", note: "the truth pair." },
  { name: "Yamaha NS-10",       category: "monitor", manufacturer: "Yamaha", status: "active", note: "the harsh second opinion." },

  // === DJ ===
  { name: "Pioneer CDJ-3000",   category: "dj", manufacturer: "Pioneer", status: "active" },
  { name: "Pioneer DJM-900NXS2", category: "dj", manufacturer: "Pioneer", status: "active" },
  { name: "Technics 1200",      category: "dj", manufacturer: "Technics", status: "active", note: "the only turntable." },
];

async function main() {
  console.log(`🎛  Seeding ${GEAR.length} pieces of gear...\n`);
  let added = 0;
  let updated = 0;
  for (const g of GEAR) {
    const slug = slugify(g.name);
    const _id = `gear-${slug}`;
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{ _id }`, { id: _id }
    );
    await client.createOrReplace({
      _id,
      _type: "gear",
      name: g.name,
      slug: { _type: "slug", current: slug },
      category: g.category,
      status: g.status,
      ...(g.manufacturer ? { manufacturer: g.manufacturer } : {}),
      ...(g.note ? { note: g.note } : {}),
      ...(g.yearAcquired ? { yearAcquired: g.yearAcquired } : {}),
      ...(g.pinned ? { pinned: g.pinned } : {}),
    });
    const tag = existing ? "↺" : "+";
    console.log(`  ${tag} ${g.category.padEnd(13)}  ${g.name}`);
    if (existing) updated += 1;
    else added += 1;
  }
  console.log(`\n✅ ${added} added · ${updated} updated · ${GEAR.length} total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
