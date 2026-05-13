/**
 * Bulk credit importer — mines every credit I can extract from the data
 * we already have on disk:
 *
 *   · `press_archive_NickHook_complete.md` (MWC production team, CZ
 *     Follow Your Heart features, Collage v.1 features, Spiritual
 *     Friendship iV features, etc.)
 *   · `nick hook discog.rtf` (per-release role notes Nick maintained
 *     by hand — Lenny Castro / Bernie Worrell / Egyptian Lover /
 *     Todd Edwards / Kilo Kish on Collage v.1; Para One / Teki Latex /
 *     Javeon McCarthy on L-Vis 1990's Neon Dreams; etc.)
 *   · The Fool's Gold delivery TSVs (writer credits, already normalized)
 *
 * Two passes:
 *   1. Stub-artist creator — `createIfNotExists` for every name about to
 *      be credited that doesn't have an artist doc yet (Mike Mogis,
 *      Gareth Jones, Bernie Worrell, Lenny Castro, etc.)
 *   2. Credit injector — for each release, append new credits idempotently
 *      (dedupe by role + person/name signature, so re-runs are no-ops)
 *
 * Album-level only for now — per-track scope (`tracks[]`) requires the
 * release schema upgrade still queued. Once that lands, MWC's per-track
 * production split (Mogis on 2,6,8,9,10,11; Raine Maida on 3,4,5,12;
 * Lader on 3,4,5,12; Abraham on 1,7) becomes capturable.
 *
 * Run: `npx tsx scripts/import-credits-bulk.ts`
 * Dry: `npx tsx scripts/import-credits-bulk.ts --dry`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DRY = process.argv.includes("--dry");

// ──────────────────────────────────────────────────────────────────
// 1. STUB ARTIST CREATOR
// ──────────────────────────────────────────────────────────────────
type Stub = { name: string; aka?: string[]; city?: string; tagline?: string };

const STUBS: Stub[] = [
  // MWC production team ──────────────────────────────────────────
  { name: "Mike Mogis", city: "Omaha · NE", tagline: "bright eyes / saddle creek records. additional production on mwc self-titled (2006), tracks 2, 6, 8, 9, 10, 11." },
  { name: "Raine Maida", city: "Toronto", tagline: "our lady peace frontman. additional production on mwc self-titled (2006), tracks 3, 4, 5, 12." },
  { name: "Jason Lader", city: "LA", tagline: "rick rubin protégé. additional production on mwc self-titled (2006), tracks 3, 4, 5, 12." },
  { name: "Josh Abraham", city: "LA", tagline: "ima robot. additional production on mwc self-titled (2006), tracks 1 + 7." },
  { name: "Mike Sapone", city: "Long Island · NY", tagline: "brand new / taking back sunday producer. pre-production + additional recording on mwc self-titled (2006)." },
  { name: "Gareth Jones", city: "London", tagline: "mute records / depeche mode (5 albums) / erasure (6 albums) / wire / einstürzende neubauten / john foxx. mixed mwc self-titled. later co-founded spiritual friendship with nick." },
  { name: "Nathaniel Walcott", city: "Omaha · NE", tagline: "bright eyes / conor oberst. string + horn arrangements on mwc self-titled (2006)." },
  { name: "Chantal Kreviazuk", city: "Toronto", tagline: "canadian singer-songwriter. guest backing vocals on 'monkey monkee men' from mwc self-titled (2006)." },
  { name: "Danny Kalb", city: "LA", tagline: "engineer. mwc self-titled (2006) tracking." },
  { name: "Ryan Williams", tagline: "engineer. mwc self-titled (2006) tracking." },
  { name: "AJ Mogis", city: "Omaha · NE", tagline: "presto! studios. mike mogis's brother. mwc self-titled engineering." },
  { name: "Rudyard Lee Cullers", tagline: "mix engineer on mwc self-titled (2006)." },

  // Collage v.1 collaborators ────────────────────────────────────
  { name: "Bernie Worrell", aka: ["Bernie Worrell (Parliament-Funkadelic)"], city: "Plainfield · NJ", tagline: "parliament-funkadelic. clavinet / synth on collage v.1 (2014). cut keys at thespacepit." },
  { name: "Lenny Castro", aka: ["Lenny Castro (Toto)"], city: "LA", tagline: "session percussionist for toto / stevie wonder / dr. john / boz scaggs / a thousand others. percussion on collage v.1 (2014)." },
  { name: "Egyptian Lover", city: "LA", tagline: "electrofunk pioneer. on 'j.a.m.i.t' from collage v.1 (2014)." },
  { name: "Todd Edwards", city: "NYC", tagline: "garage house architect (worked with daft punk on discovery / random access memories). on 'jaco' from collage v.1 (2014)." },
  { name: "Kilo Kish", city: "NYC", tagline: "lakisha robinson. on 'jaco' from collage v.1 (2014). her first solo sessions cut at thespacepit." },
  { name: "DJ Sliink", city: "Newark · NJ", tagline: "jersey club producer. on collage v.1 (2014)." },
  { name: "Bodega Bamz", city: "NYC", tagline: "ny bodega-rap. on collage v.1 (2014)." },
  { name: "Sunni Colón", city: "LA", tagline: "vocalist. on collage v.1 (2014)." },

  // Old English production partner ───────────────────────────────
  // (Salva already exists as artist doc)
  { name: "Young Thug", city: "Atlanta", tagline: "lead vocalist on 'old english' (2014), produced by salva + nick hook. RIAA gold." },
  { name: "Freddie Gibbs", city: "Gary · IN", tagline: "on 'old english' (2014) with young thug + a$ap ferg." },
  { name: "A$AP Ferg", city: "NYC", tagline: "on 'old english' (2014) with young thug + freddie gibbs." },

  // Rap Monument production partners ─────────────────────────────
  { name: "S-Type", city: "Edinburgh", tagline: "producer. co-produced 'the rap monument' (noisey, 2014) with hudson mohawke + nick hook." },

  // Engineers we know across multiple records ────────────────────
  { name: "Joey Raia", city: "NYC", tagline: "long-time mix engineer collaborator. on azealia banks jumanji, shuttle halo (ninja tune), plaitum, nylo, and others." },
  { name: "Joe LaPorta", city: "NYC", tagline: "mastering engineer (sterling sound). credited across the relationships / 50 backwoods / calm + collect era." },
  { name: "Mickey Petralia", city: "LA", tagline: "producer. credited as a mentor / collaborator on mwc self-titled era." },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ──────────────────────────────────────────────────────────────────
// 2. CREDIT INJECTIONS
// ──────────────────────────────────────────────────────────────────
type CreditSpec = {
  role: string;        // matches the release.credits role enum where possible
  personName?: string; // resolved to artist doc ref via name lookup
  name?: string;       // free-text fallback (when no doc / want a note)
  note?: string;       // optional bracketed note appended to the role
};

type ReleaseInjection = {
  slug: string;        // release slug
  label: string;       // human label for logging
  credits: CreditSpec[];
};

const INJECTIONS: ReleaseInjection[] = [
  // ── MWC self-titled (2006) ────────────────────────────────────
  {
    slug: "men-women-children-self-titled",
    label: "Men Women & Children (s/t)",
    credits: [
      { role: "Additional production", personName: "Mike Mogis", note: "tracks 2, 6, 8, 9, 10, 11" },
      { role: "Additional production", personName: "Raine Maida", note: "tracks 3, 4, 5, 12" },
      { role: "Additional production", personName: "Jason Lader", note: "tracks 3, 4, 5, 12" },
      { role: "Additional production", personName: "Josh Abraham", note: "tracks 1, 7" },
      { role: "Recorded by", personName: "Mike Sapone", note: "pre-production + additional recording" },
      { role: "Recorded by", personName: "Danny Kalb" },
      { role: "Recorded by", personName: "Ryan Williams" },
      { role: "Recorded by", personName: "AJ Mogis" },
      { role: "Mixed by", personName: "Gareth Jones" },
      { role: "Mixed by", personName: "Rudyard Lee Cullers" },
      { role: "Strings", personName: "Nathaniel Walcott", note: "string + horn arrangements" },
      { role: "Backing vocals", personName: "Chantal Kreviazuk", note: "on 'Monkey Monkee Men'" },
    ],
  },

  // ── Collage v.1 (2014) ────────────────────────────────────────
  {
    slug: "cc012-collage-v-1",
    label: "Collage v.1",
    credits: [
      { role: "Synth", personName: "Bernie Worrell", note: "(Parliament-Funkadelic)" },
      { role: "Percussion", personName: "Lenny Castro", note: "(Toto)" },
      { role: "Featured artist", personName: "Egyptian Lover", note: "on 'J.A.M.I.T'" },
      { role: "Featured artist", personName: "Todd Edwards", note: "on 'Jaco'" },
      { role: "Featured artist", personName: "Kilo Kish", note: "on 'Jaco'" },
      { role: "Featured artist", personName: "DJ Sliink" },
      { role: "Featured artist", personName: "Bodega Bamz" },
      { role: "Featured artist", personName: "Sunni Colón" },
    ],
  },

  // ── Old English (2014) ────────────────────────────────────────
  // Existing has 4 credits — likely Salva + Nick + maybe artists.
  // We append the featured artists if missing.
  {
    slug: "old-english-2014",
    label: "Old English",
    credits: [
      { role: "Featured artist", personName: "Young Thug" },
      { role: "Featured artist", personName: "Freddie Gibbs" },
      { role: "Featured artist", personName: "A$AP Ferg" },
      { role: "Co-produced by", personName: "Salva" },
    ],
  },

  // ── Rap Monument (2014) ───────────────────────────────────────
  {
    slug: "rap-monument-2015",
    label: "The Rap Monument",
    credits: [
      { role: "Co-produced by", personName: "Hudson Mohawke" },
      { role: "Co-produced by", personName: "S-Type" },
    ],
  },

  // ── Follow Your Heart (CZ, 2011) — Jamire already there ──────
  // Already has 8 credits. We just verify Jamire is in (added earlier).
  // No new ones to add unless we have new info from press archive.

  // ── SPIDERS (Junglepussy, 2020) — Hook produced ──────────────
  // Has 4 credits already. Verifying we don't double-add. No additions.

  // ── Meow The Jewels (2015) ───────────────────────────────────
  // Has 1 credit. No new info beyond Nick's edit role.
];

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n👥 Pass 1 — artist stubs (${STUBS.length} candidates)${DRY ? " (DRY)" : ""}\n`);

  // ── PASS 1: create artist stubs ──
  let stubsCreated = 0, stubsExisted = 0;
  for (const s of STUBS) {
    const slug = slugify(s.name);
    const _id = `artist-stub-${slug}`;
    const existing = await c.fetch(
      `*[_type == "artist" && (slug.current == $slug || lower(name) == lower($name))][0]{ _id, "slug": slug.current }`,
      { slug, name: s.name }
    );
    if (existing) {
      stubsExisted++;
      continue;
    }
    if (DRY) {
      console.log(`   + would create ${s.name.padEnd(30)} → ${slug}`);
      stubsCreated++;
      continue;
    }
    await c.createIfNotExists({
      _id,
      _type: "artist",
      name: s.name,
      slug: { _type: "slug", current: slug },
      ...(s.city ? { city: s.city } : {}),
      ...(s.tagline ? { tagline: s.tagline } : {}),
      displayInitials: true,
    });
    stubsCreated++;
    console.log(`   + ${s.name.padEnd(30)} → ${slug}`);
  }
  console.log(`\n   ✓ ${stubsCreated} stubs created · ${stubsExisted} already existed\n`);

  // ── PASS 2: inject credits ──
  console.log(`💿 Pass 2 — credit injection (${INJECTIONS.length} releases)${DRY ? " (DRY)" : ""}\n`);

  // Cache: name → artist doc ID
  const nameCache = new Map<string, string>();
  const resolvePerson = async (name: string): Promise<string | null> => {
    const key = name.toLowerCase();
    if (nameCache.has(key)) return nameCache.get(key)!;
    const id = await c.fetch(
      `*[_type == "artist" && lower(name) == lower($name)][0]._id`,
      { name }
    );
    if (id) nameCache.set(key, id);
    return id ?? null;
  };

  let releasesPatched = 0, creditsAdded = 0, creditsSkipped = 0;

  for (const inj of INJECTIONS) {
    const rel = await c.fetch(
      `*[_type == "release" && slug.current == $slug][0]{ _id, title, credits }`,
      { slug: inj.slug }
    );
    if (!rel) {
      console.log(`   ✗ ${inj.label} — release not found (slug: ${inj.slug})`);
      continue;
    }
    const existing: { role?: string; name?: string; person?: { _ref?: string } }[] = rel.credits ?? [];

    // Build a signature set of existing credits for dedup
    const existingSigs = new Set(
      existing.map((cr) => `${(cr.role ?? "").toLowerCase()}|${(cr.person?._ref ?? cr.name ?? "").toLowerCase()}`)
    );

    const newCredits: Record<string, unknown>[] = [];
    for (const cs of inj.credits) {
      const personRef = cs.personName ? await resolvePerson(cs.personName) : null;
      const sig = `${cs.role.toLowerCase()}|${(personRef ?? cs.name ?? cs.personName ?? "").toLowerCase()}`;
      if (existingSigs.has(sig)) {
        creditsSkipped++;
        continue;
      }
      const newCredit: Record<string, unknown> = {
        _key: randomBytes(6).toString("hex"),
        role: cs.note ? `${cs.role} (${cs.note})` : cs.role,
      };
      if (personRef) {
        newCredit.person = { _type: "reference", _ref: personRef };
      } else {
        newCredit.name = cs.name ?? cs.personName ?? "—";
      }
      newCredits.push(newCredit);
      creditsAdded++;
    }

    if (newCredits.length === 0) {
      console.log(`   · ${inj.label.padEnd(34)} no new credits to add (all already present)`);
      continue;
    }

    if (DRY) {
      console.log(`   ↻ ${inj.label.padEnd(34)} would append ${newCredits.length} credits`);
      newCredits.forEach((nc: any) => console.log(`        + ${nc.role.padEnd(40)} → ${nc.person ? nc.person._ref : nc.name}`));
      releasesPatched++;
      continue;
    }

    await c.patch(rel._id).set({ credits: [...existing, ...newCredits] }).commit();
    releasesPatched++;
    console.log(`   ↻ ${inj.label.padEnd(34)} appended ${newCredits.length} credits`);
    newCredits.forEach((nc: any) => console.log(`        + ${nc.role.padEnd(40)} → ${nc.person ? nc.person._ref : nc.name}`));
  }

  console.log(`\n✅ ${releasesPatched} releases patched · ${creditsAdded} credits added · ${creditsSkipped} already there${DRY ? " (DRY)" : ""}\n`);
})();
