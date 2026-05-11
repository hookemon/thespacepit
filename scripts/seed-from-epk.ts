/**
 * Seed Brand + PressQuote docs from the content extracted from Nick's EPKs.
 * (The bio paragraphs go in code components, not Sanity — they're heading copy.)
 *
 * Idempotent — re-run upserts by _id.
 *
 * Run: npx tsx scripts/seed-from-epk.ts
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
  s.toLowerCase().replace(/['"’&]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// --- BRANDS (from EPK "COLABORATIONS" page) ---
type BrandSeed = { name: string; relationship?: string; tagline?: string; websiteUrl?: string; featured?: boolean };

const BRANDS: BrandSeed[] = [
  { name: "Teenage Engineering", relationship: "artist mentor", tagline: "artist-mentor + ongoing gear collabs.", websiteUrl: "https://teenage.engineering", featured: true },
  { name: "Ableton", relationship: "collaborator", tagline: "collaborator-in-chief — productions, demos, and the Move beat.", websiteUrl: "https://ableton.com", featured: true },
  { name: "Moog", relationship: "collaborator", tagline: "moog week, moogfest, the prophet-08 chase.", websiteUrl: "https://moogmusic.com", featured: true },
  { name: "Serato", relationship: "collaborator", tagline: "seratocast mix series + dj support.", websiteUrl: "https://serato.com" },
  { name: "Roland", relationship: "collaborator", tagline: "the 808 stays patched in.", websiteUrl: "https://roland.com" },
  { name: "Eventide", relationship: "collaborator", tagline: "the H3000 + a tutorial deep-dive.", websiteUrl: "https://eventideaudio.com" },
  { name: "Native Instruments", relationship: "collaborator", websiteUrl: "https://native-instruments.com" },
  { name: "Splice", relationship: "collaborator", tagline: "samples + sessions.", websiteUrl: "https://splice.com" },
  { name: "Boiler Room", relationship: "collaborator", tagline: "live sets + radio.", websiteUrl: "https://boilerroom.tv" },
  { name: "Red Bull Music Academy", relationship: "alumni · 2011", tagline: "RBMA 2011 + RBMA Radio sessions through the years." },
  { name: "Noisey / Vice", relationship: "collaborator", tagline: "vice + hennessy rap monument and more.", websiteUrl: "https://www.vice.com" },
  { name: "Rockstar Games", relationship: "collaborator", tagline: "co-producer on the GTA V soundtrack.", websiteUrl: "https://rockstargames.com" },
  { name: "Fool's Gold Records", relationship: "alumni", tagline: "fool's gold day off + early home for nick's catalogue.", websiteUrl: "https://www.foolsgoldrecs.com" },
];

// --- PRESS (from EPK "PRESS" + "QUOTES" pages) ---
type PressSeed = { quote: string; source: string; year?: number; url?: string };

const PRESS: PressSeed[] = [
  // From the QUOTES page
  { quote: "A renowned producer straddling the worlds of hip-hop and alternative music.", source: "Sound on Sound" },
  { quote: "Hook's collaborative spirit tends to bring out the best in him.", source: "Pitchfork" },
  { quote: "It's a mentality that's made him one of new york's most in-demand producers.", source: "Fact Magazine" },
  { quote: "Hook's collaborations span the worlds of Run The Jewels, Azealia Banks, Young Thug, Mr Wonderful and more — to name a few.", source: "Sound on Sound" },
  // From the PRESS page (publication-only — fill in real quote text in /studio when you have time)
  { quote: "Nick Hook · DJ Producer / Bauer and Working with Young Thug.", source: "SPIN" },
  { quote: "Nick Hook takes DJ production from the New York apartment up to its biggest, most heart-wrenching new york relationships on september 11.", source: "Fader Mix" },
  { quote: "Nick Hook · Against The Clock.", source: "Fact Magazine" },
  { quote: "Nick Hook + DJ Earl break down 50 backwoods, talking music and friends.", source: "Passion of the Weiss" },
  { quote: "Producers Salva and Nick Hook discuss old english feat. Young Thug, Freddie Gibbs and ASAP Ferg + other projects.", source: "All Hip Hop" },
  { quote: "Meet XLR8R's new advice columnist: Nick Hook.", source: "XLR8R" },
  { quote: "Nick Hook on his first label rollout: 50 backwoods is the best album of the entire year.", source: "Billboard" },
  { quote: "Desde brooklyn, Nick Hook nos premia para su próxima presentación en latinoamérica.", source: "Vibras (LATAM)" },
  { quote: "Run The Jewels y su viaje íntimo en latinoamérica, made in fútbol por el hip-hop stone en español.", source: "Latin press" },
  { quote: "Producers Salva & Nick Hook discuss old english feat. Young Thug, Freddie Gibbs & MAPS Ferg + other projects.", source: "Hot New Hip Hop" },
];

async function seed() {
  console.log(`\n🎚  Seeding from EPK content...\n`);

  console.log(`Upserting ${BRANDS.length} brands...`);
  for (const b of BRANDS) {
    const slug = slugify(b.name);
    const _id = `brand-${slug}`;
    await client.createOrReplace({
      _id,
      _type: "brand",
      name: b.name,
      slug: { _type: "slug", current: slug },
      relationship: b.relationship,
      tagline: b.tagline,
      websiteUrl: b.websiteUrl,
      featured: b.featured ?? false,
    });
    process.stdout.write(".");
  }
  console.log(` ${BRANDS.length} done`);

  console.log(`\nUpserting ${PRESS.length} press quotes...`);
  for (const p of PRESS) {
    const slug = slugify(`${p.source}-${p.quote}`).slice(0, 80);
    const _id = `press-${slug}`;
    await client.createOrReplace({
      _id,
      _type: "pressQuote",
      quote: p.quote,
      source: p.source,
      year: p.year,
      url: p.url,
      featured: true,
    });
    process.stdout.write(".");
  }
  console.log(` ${PRESS.length} done`);

  console.log(`\n✅ Done.`);
  console.log(`   Visit /partners to see brands.`);
  console.log(`   Visit /nick-hook#press to see quotes.`);
  console.log(`\nNote: studio client list (artists hosted at thespacepit) NOT auto-seeded —`);
  console.log(`my OCR read of that EPK page was rough and you said no jpegmafia ever 🫡`);
  console.log(`I'll surface a clean list once you confirm names or paste a definitive list.`);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
