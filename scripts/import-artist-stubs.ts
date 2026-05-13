/**
 * Stub artist-doc creator.
 *
 * For every featured artist credited on a Nick Hook release that doesn't
 * yet have an artist doc in Sanity, create a minimal stub (just name +
 * slug + a placeholder displayInitials toggle). This lets the tracklist
 * render `feat. NAME` as a clickable link to /artists/<slug> immediately,
 * and Nick (or me) can flesh out bio / portrait / city later.
 *
 * Idempotent — uses slug-derived stable IDs and `createIfNotExists`.
 *
 * Run: `npx tsx scripts/import-artist-stubs.ts`
 * Dry: `npx tsx scripts/import-artist-stubs.ts --dry`
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

const DRY = process.argv.includes("--dry");

// ── The list of featured artists missing from Sanity ────────────
// Populated from a one-off audit of Relationships LP + 50 Backwoods +
// CZ Follow Your Heart features against existing artist docs. Each
// entry: canonical name (matches what's in tracklist features[] arrays),
// optional city/tagline for context. Slug is auto-derived.
type Stub = { name: string; city?: string; tagline?: string; aliases?: string[] };

const STUBS: Stub[] = [
  // ── Relationships LP era ──
  { name: "Prefuse 73", city: "Atlanta · Brooklyn", tagline: "guillermo scott herren. cut “fudge” w/ michael christmas at thespacepit during the relationships sessions." },
  { name: "Michael Christmas", city: "Boston · MA", tagline: "boston rapper. on “pro-choice.” cut “fudge” at thespacepit w/ prefuse 73." },
  { name: "DJ Rashad", city: "Chicago · IL", tagline: "footwork luminary. teklife. on “+3” + “the infinite loop” — recorded before his passing in 2014." },
  { name: "Spank Rock", city: "Baltimore", tagline: "naeem juwan, baltimore club legend. on “another way.”" },
  { name: "Meyhem Lauren", city: "Queens · NYC", tagline: "queens rapper, action bronson orbit. on “live while i’m living.”" },
  { name: "Rahel", city: "NYC", tagline: "vocalist. on “need 2 b.”" },
  { name: "Nasty Nigel", city: "NYC", tagline: "world’s fair / queens rap. on “+3,” “lovesong,” + “the infinite loop.”" },
  { name: "Chino Moreno", city: "Sacramento · LA", tagline: "deftones frontman. guest on “the infinite loop.”" },
  { name: "iLoveMakonnen", city: "Atlanta", tagline: "atlanta rapper / singer. on “all alone.”" },
  { name: "Black Kray", city: "Richmond · VA", tagline: "goth shaolin / sickboyrari. on “pro-choice.”" },
  { name: "Father", city: "Atlanta", tagline: "awful records. on “pro-choice.”" },
  { name: "KCSB", tagline: "on “pro-choice.”" },
  { name: "DJ Paypal", city: "Berlin", tagline: "footwork producer. on “+3.”" },
  { name: "24Hrs", city: "Atlanta", tagline: "rapper. on “gucci’s.”" },
  { name: "Bulletproof Dolphin", city: "NYC", tagline: "on “head” w/ 21 savage." },

  // ── CZ Follow Your Heart ──
  { name: "Bilal", city: "Philadelphia · NYC", tagline: "soul / r&b vocalist. on cz “night or day.”" },
  { name: "Coltrane", tagline: "on cz “cherry nights.”" },
  { name: "Dâm-Funk", city: "Pasadena · LA", tagline: "stones throw / glydezone. on cz “i got what you need.” we cut his namesake remix on the fuck work ep too.", aliases: ["Dam Funk", "Dam-Funk"] },
  { name: "Drop The Lime", city: "NYC", tagline: "trouble & bass / bass — luca venezia. on cz “runnin in and out of love.”" },
  { name: "Daud Sturdivant", city: "NYC", tagline: "co-founding member of cubic zirconia, percussion + keys.", aliases: ["Daud"] },

  // ── 50 Backwoods era ──
  { name: "Wiki", city: "NYC", tagline: "ratking / wiki. on “hook chop.”" },
  { name: "MeLo-X", city: "Brooklyn", tagline: "producer / vocalist / dj. on “we the people.”" },
  { name: "Jacks", tagline: "jamaican mc. on “i’m smokin.”" },

  // ── CTMN remixes ──
  { name: "ARME", tagline: "on the “can’t tell me nothing” arme remix." },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (Dâm → dam)
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

(async () => {
  console.log(`\n👥 Artist stub importer — ${STUBS.length} candidates${DRY ? " (DRY)" : ""}\n`);
  let created = 0, existed = 0;

  for (const s of STUBS) {
    const slug = slugify(s.name);
    const _id = `artist-stub-${slug}`;

    // Check if there's ALREADY an artist with this slug (from earlier work).
    // If so, skip — never overwrite real artist docs with stub data.
    const existing = await c.fetch(
      `*[_type == "artist" && (slug.current == $slug || lower(name) == lower($name))][0]{ _id, name, "slug": slug.current }`,
      { slug, name: s.name }
    );

    if (existing) {
      console.log(`   · ${s.name.padEnd(28)} already exists → ${existing.slug}`);
      existed++;
      continue;
    }

    const doc = {
      _id,
      _type: "artist",
      name: s.name,
      slug: { _type: "slug", current: slug },
      ...(s.city ? { city: s.city } : {}),
      ...(s.tagline ? { tagline: s.tagline } : {}),
      // displayInitials defaults to false in the schema; flip it on so the
      // bare stub renders something visually instead of an empty page until
      // a portrait gets uploaded.
      displayInitials: true,
    };

    if (DRY) {
      console.log(`   + ${s.name.padEnd(28)} would create → ${slug}`);
      created++;
      continue;
    }

    await c.createIfNotExists(doc);
    console.log(`   + ${s.name.padEnd(28)} created → ${slug}`);
    created++;
  }

  console.log(`\n✅ ${created} created · ${existed} already existed${DRY ? " (DRY)" : ""}\n`);
})();
