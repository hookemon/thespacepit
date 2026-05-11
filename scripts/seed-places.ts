/**
 * Seed key map pins — studios + memorable tour stops + a few favorite spots.
 * Idempotent — uses deterministic _id keyed on slug.
 *
 * Run: npx tsx scripts/seed-places.ts
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

type PlaceSeed = {
  name: string;
  kind:
    | "studio" | "show" | "club" | "festival" | "restaurant"
    | "bar" | "hotel" | "record-store" | "vibe" | "moment";
  city: string;
  country: string;
  lat: number;
  lng: number;
  tagline?: string;
  year?: number;
  featured?: boolean;
  websiteUrl?: string;
};

const PLACES: PlaceSeed[] = [
  // === STUDIOS ===
  {
    name: "thespacepit",
    kind: "studio",
    city: "Brooklyn",
    country: "USA",
    lat: 40.6782,
    lng: -73.9442,
    tagline: "the studio. yellow graffiti walls signed by everyone who's recorded here.",
    year: 2011,
    featured: true,
  },
  {
    name: "la burbuja",
    kind: "studio",
    city: "Medellín",
    country: "Colombia",
    lat: 6.2442,
    lng: -75.5812,
    tagline: "the garden room. nick + quazzy. medellín's hideout.",
    year: 2018,
    featured: true,
  },

  // === FESTIVALS ===
  {
    name: "Sónar",
    kind: "festival",
    city: "Barcelona",
    country: "Spain",
    lat: 41.3725,
    lng: 2.1539,
    tagline: "808 nearly died here. she came back.",
    year: 2012,
    featured: true,
  },
  {
    name: "Movement Festival",
    kind: "festival",
    city: "Detroit",
    country: "USA",
    lat: 42.3289,
    lng: -83.0392,
    tagline: "memorial day weekend in the d.",
    featured: true,
  },
  {
    name: "Moogfest",
    kind: "festival",
    city: "Durham",
    country: "USA",
    lat: 35.9940,
    lng: -78.8986,
  },
  {
    name: "Pitchfork Music Festival",
    kind: "festival",
    city: "Chicago",
    country: "USA",
    lat: 41.8035,
    lng: -87.6720,
    tagline: "Cubic Zirconia, 2010.",
  },
  {
    name: "BPM Festival",
    kind: "festival",
    city: "Playa del Carmen",
    country: "Mexico",
    lat: 20.6296,
    lng: -87.0739,
    tagline: "the contract that opened up latin america.",
    year: 2015,
  },
  {
    name: "Medellín Music Week",
    kind: "festival",
    city: "Medellín",
    country: "Colombia",
    lat: 6.2476,
    lng: -75.5658,
  },

  // === ICONIC VENUES / SHOWS ===
  {
    name: "MoMA PS1",
    kind: "show",
    city: "Queens",
    country: "USA",
    lat: 40.7456,
    lng: -73.9474,
    tagline: "Warm Up series. the museum-as-club moment.",
  },
  {
    name: "Boiler Room",
    kind: "show",
    city: "Brooklyn",
    country: "USA",
    lat: 40.7128,
    lng: -73.9482,
    tagline: "first one streaming live to the world.",
  },
  {
    name: "Low End Theory",
    kind: "club",
    city: "Los Angeles",
    country: "USA",
    lat: 34.0875,
    lng: -118.2607,
    tagline: "Cubic Zirconia '09 — first time Nick met Flying Lotus, Gaslamp Killer, Ras G.",
    year: 2009,
  },
  {
    name: "Razzmatazz",
    kind: "club",
    city: "Barcelona",
    country: "Spain",
    lat: 41.3982,
    lng: 2.1907,
    year: 2014,
  },

  // === RTJ TOUR 2017 ANCHOR CITIES ===
  {
    name: "House of Blues",
    kind: "show",
    city: "New Orleans",
    country: "USA",
    lat: 29.9523,
    lng: -90.0688,
    tagline: "RTJ '17 tour kickoff. Jan 11.",
    year: 2017,
  },

  // === ASIA / INDIA TOUR ===
  {
    name: "Bali",
    kind: "vibe",
    city: "Ubud",
    country: "Indonesia",
    lat: -8.5069,
    lng: 115.2625,
    tagline: "Asia tour '20. before everything shut.",
    year: 2020,
  },
  {
    name: "Mumbai",
    kind: "show",
    city: "Mumbai",
    country: "India",
    lat: 19.0760,
    lng: 72.8777,
    year: 2020,
  },

  // === A FEW REAL SPOTS NICK LOVES ===
  {
    name: "Bandeja Paisa",
    kind: "restaurant",
    city: "Medellín",
    country: "Colombia",
    lat: 6.2087,
    lng: -75.5675,
    tagline: "the comfort plate. beans, rice, plantain, egg, arepa, chicharrón.",
  },
];

async function main() {
  console.log(`📍 Seeding ${PLACES.length} places...\n`);
  for (const p of PLACES) {
    const slug = slugify(p.name + "-" + p.city);
    const _id = `place-${slug}`;
    await client.createOrReplace({
      _id,
      _type: "place",
      name: p.name,
      slug: { _type: "slug", current: slug },
      kind: p.kind,
      city: p.city,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      ...(p.tagline ? { tagline: p.tagline } : {}),
      ...(p.year ? { year: p.year } : {}),
      ...(p.featured ? { featured: p.featured } : {}),
      ...(p.websiteUrl ? { websiteUrl: p.websiteUrl } : {}),
    });
    console.log(`  ✓ ${p.kind.padEnd(11)}  ${p.name}, ${p.city}`);
  }
  console.log(`\n✅ ${PLACES.length} places seeded`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
