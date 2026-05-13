/**
 * Seed the skeleton brand pages for gear-making partners. Each brand gets:
 *   · tagline · relationship · website · pinned-to-top
 *   · a short story (Nick's relationship with that brand)
 *
 * The auto-rack feature on /partners/[slug] already surfaces every gear doc
 * whose manufacturer matches the brand, so we don't need to manually populate
 * productsUsed[]. Result: 6 dead pages go from "name only" → fully populated.
 *
 * For each brand we know exists in Sanity already (Roland, Moog, Eventide,
 * Native Instruments, Boiler Room, Splice, Serato, Noisey, RBMA, Rockstar,
 * Fool's Gold). Pinning is conservative — only the gear-heavy / mentor brands
 * get featured: true.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type BrandSeed = {
  slug: string;
  tagline: string;
  relationship: string;
  websiteUrl: string;
  featured?: boolean;
  // Each block is one paragraph of intro copy. Renders on the brand page
  // above the auto-rack section.
  story: string[];
};

const SEEDS: BrandSeed[] = [
  {
    slug: "roland",
    tagline: "808 · 909 · SH-101 · juno · sp-404 · jp-8000 · mc-505. the backbone.",
    relationship: "ambassador",
    websiteUrl: "https://www.roland.com",
    featured: true,
    story: [
      "If you sort every drum on every record I've made, more than half come from a Roland. The 808 lives on the desk. The 909 next to it. The SP-404 follows me on the road.",
      "I work directly with Roland on the SP-404 MKII firmware — every release of v4.04 cycles through my room first. They sent me to demo gear at NAMM. We've shot together. The TR-808 sample pack on Roland Cloud uses my kit.",
    ],
  },
  {
    slug: "moog",
    tagline: "moog mentor since 2004. matriarch · voyager · minimoog · grandmother · MF series.",
    relationship: "artist mentor",
    websiteUrl: "https://www.moogmusic.com",
    featured: true,
    story: [
      "Moog has been a constant in my career since before I had a label. Bob Moog's company introduced me to the synth voice that's become my fingerprint — the Voyager + Matriarch combo lives in the spacepit, the Minitaur travels.",
      "Long working relationship with Moog Music — workshops at Moogfest, the Werkstatt kit collab, deep dives on the Mariana plug-in. The MF-series pedals (delay, chorus, ring mod) sit in every guitar chain I touch.",
    ],
  },
  {
    slug: "eventide",
    tagline: "h3000 · h9 · h90 · space · the harmonizer family. every pitch shift you hear.",
    relationship: "artist",
    websiteUrl: "https://www.eventideaudio.com",
    featured: true,
    story: [
      "Eventide is the FX rack of my dreams — H3000 in the studio for the impossible-pitch stuff, H90 + Space for live, H9 Max for travel. Every weird harmony move on a Spiritual Friendship record routes through their hardware.",
      "Working relationship with Eventide for years — every plug-in they release lands in my session within a week. The Blackhole reverb on more songs than I can count.",
    ],
  },
  {
    slug: "native-instruments",
    tagline: "maschine · komplete · the OG software relationship since 2007.",
    relationship: "collaborator",
    websiteUrl: "https://www.native-instruments.com",
    story: [
      "Native Instruments was the first software company I had a relationship with — back to 2007, on and off. Komplete is the deepest sound library I own. Maschine Mk1 + Maschine+ both live in the rig.",
      "Did the NI artist photo shoot for the spacepit. Long-standing Komplete user — every record gets at least one Kontakt instrument involved.",
    ],
  },
  {
    slug: "serato",
    tagline: "dj · studio · sample. the dj relationship.",
    relationship: "collaborator",
    websiteUrl: "https://serato.com",
    story: [
      "Long working relationship with Serato — Serato DJ on every gig, Serato Studio + Sample for production. The SP-404 MKII x Serato DJ video lives on their channel.",
      "Hoping to rock the SL slab next — that conversation's open.",
    ],
  },
  {
    slug: "boiler-room",
    tagline: "documented at the pit. brooklyn sessions.",
    relationship: "collaborator",
    websiteUrl: "https://www.boilerroom.tv",
    story: [
      "Boiler Room came through the spacepit for sessions across multiple eras — Cubic Zirconia, solo runs, Run The Jewels rehearsals. The room has been documented enough that the footage feels like its own discography.",
    ],
  },
  {
    slug: "red-bull-music-academy",
    tagline: "rbma 2012 · nyc. the school year that broke open the network.",
    relationship: "alumnus",
    websiteUrl: "https://www.redbullmusicacademy.com",
    story: [
      "RBMA New York 2012. Six weeks that completely changed who I had in my address book. Bernie Worrell. Just Blaze. The whole industry compressed into one term.",
      "Played the RBMA series, contributed to their Sound Pellegrino podcast, recorded at the RBMA NY studios. The compilation 'Various Assets — Not For Sale' includes my work from that session.",
    ],
  },
  {
    slug: "rockstar-games",
    tagline: "grand theft auto online · casino heist score · 2020.",
    relationship: "collaborator",
    websiteUrl: "https://www.rockstargames.com",
    story: [
      "Composed for the Diamond Casino Heist update on GTA Online (2020). One of the rare game-score gigs that actually let me push the spacepit sound into a different medium.",
    ],
  },
  {
    slug: "splice",
    tagline: "sample packs. the loop economy.",
    relationship: "collaborator",
    websiteUrl: "https://splice.com",
    story: [
      "Splice has hosted some of the spacepit sample drops. The 808s I curated, the loop packs — all distributable through their platform.",
    ],
  },
  {
    slug: "noisey-vice",
    tagline: "the rap monument · documented sessions at the pit.",
    relationship: "documented",
    websiteUrl: "https://www.vice.com/en/section/music",
    story: [
      "Noisey shot 'The Rap Monument — Behind The Scenes — New York City' at the spacepit. The piece captured Action Bronson, the studio walls, and the assembly-line creative process that's defined this room.",
    ],
  },
  {
    slug: "fools-gold-records",
    tagline: "early collaborator label — A-Trak, Nick Catchdubs, the era.",
    relationship: "collaborator",
    websiteUrl: "https://fools-gold.bandcamp.com",
    story: [
      "Fool's Gold was part of the downtown NYC bass-music ecosystem when Cubic Zirconia was active. A-Trak, Nick Catchdubs, the whole circuit — overlapped on bills, in studios, on remixes.",
    ],
  },
];

function toPortableText(paragraphs: string[]): unknown[] {
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `brand-story-${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `brand-story-${i}-s`, text: p, marks: [] }],
  }));
}

async function main() {
  console.log(`🏷  seeding ${SEEDS.length} brand pages\n`);

  for (const seed of SEEDS) {
    const id = await sanity.fetch<string | null>(
      `*[_type == "brand" && slug.current == $slug][0]._id`,
      { slug: seed.slug }
    );
    if (!id) {
      console.log(`  ✗ brand "${seed.slug}" not found in Sanity, skipping`);
      continue;
    }
    await sanity.patch(id).set({
      tagline: seed.tagline,
      relationship: seed.relationship,
      websiteUrl: seed.websiteUrl,
      featured: !!seed.featured,
      story: toPortableText(seed.story),
    }).commit();
    console.log(`  ✓ ${seed.slug.padEnd(28)} ${seed.featured ? "★ featured" : ""}`);
  }

  console.log("\nopen /partners to see them all on the index");
}
main().catch((err) => { console.error(err); process.exit(1); });
