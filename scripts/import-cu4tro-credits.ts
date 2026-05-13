/**
 * RTJ CU4TRO per-track credits.
 *
 * Adds the "version producer" for each of the 11 tracks (the Latin artist
 * who reworked that specific track) as a Co-produced by credit scoped to
 * that track via the new tracks[] field. When you click a track row on
 * /releases/rtj-cu4tro-2023, the per-song pop-out reveals exactly who
 * remade that version — TROOKO on Yankee, Bomba Estéreo on Nunca Mirar
 * Hacia Atrás, Toy Selectah on JU$T, etc.
 *
 * Plus stubs for any of those producers not yet in Sanity.
 *
 * Run: `npx tsx scripts/import-cu4tro-credits.ts`
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

const STUBS = [
  { name: "TROOKO", city: "Bogotá · LA", tagline: "puerto rican producer based in la. did the 'yankee y el valiente' + 'fuera de vista' versions on rtj cu4tro." },
  { name: "Mexican Institute of Sound", city: "Mexico City", tagline: "camilo lara. naafi orbit. did the 'ooh la la ft. santa fe klan' version on rtj cu4tro." },
  { name: "Toy Selectah", city: "Monterrey · MX", tagline: "toy hernandez. legendary mexican producer. did the 'JU$T ft. pharrell + zack de la rocha' version on rtj cu4tro." },
  { name: "Bomba Estéreo", city: "Bogotá · CO", tagline: "li saumet + simón mejía. colombian electrocumbia legend. did the 'nunca mirar hacia atrás' version on rtj cu4tro." },
  { name: "Son Rompe Pera", city: "Mexico City", tagline: "punk-marimba band. did the 'el suelo debajo' version on rtj cu4tro." },
  { name: "Mas Aya", city: "Toronto · NIC", tagline: "brandon valdivia. nicaraguan-canadian percussionist. did the 'tirando el detonador' version w/ nick on rtj cu4tro." },
  { name: "Orestes Gomez", city: "CDMX", tagline: "did the 'caminando en la nieve' version w/ nick on rtj cu4tro." },
  { name: "Danny Brasco", city: "CDMX", tagline: "did the 'goonies contra e.t.' version w/ nick on rtj cu4tro." },
  { name: "Adrian Terrazas González", city: "Mexico", tagline: "ex-mars volta. did the 'unas palabras para el pelotón de fusilamiento' version w/ el-producto on rtj cu4tro." },
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

// Map: substring of stored track title → list of "version by" producers
// to credit on that track. Track titles in Sanity are loose-cased and have
// the version description embedded — we match on a unique fragment.
const TRACK_PRODUCERS: { match: string; producers: string[] }[] = [
  { match: "yankee y el valiente",                producers: ["TROOKO"] },
  { match: "ooh la la",                            producers: ["Mexican Institute of Sound"] },
  { match: "fuera de vista",                       producers: ["TROOKO"] },
  { match: "Santa Calamafuck",                     producers: ["Nick Hook"] },
  { match: "goonies contra E.T.",                  producers: ["Danny Brasco", "Nick Hook"] },
  { match: "caminando en la nieve",                producers: ["Orestes Gomez", "Nick Hook"] },
  { match: "JU$T",                                 producers: ["Toy Selectah"] },
  { match: "nunca mirar hacia atras",              producers: ["Bomba Estéreo"] },
  { match: "el suelo debajo",                      producers: ["Son Rompe Pera"] },
  { match: "tirando el detonador",                 producers: ["Mas Aya", "Nick Hook"] },
  { match: "unas palabras para el peloton",        producers: ["Adrian Terrazas González", "El-P"] },
];

(async () => {
  console.log("\n👥 Pass — CU4TRO version producers stubs\n");

  for (const s of STUBS) {
    const slug = slugify(s.name);
    const existing = await c.fetch(
      `*[_type == "artist" && (slug.current == $slug || lower(name) == lower($name))][0]{ _id, "slug": slug.current }`,
      { slug, name: s.name }
    );
    if (existing) {
      console.log(`  · ${s.name.padEnd(32)} already exists`);
      continue;
    }
    await c.createIfNotExists({
      _id: `artist-stub-${slug}`,
      _type: "artist",
      name: s.name,
      slug: { _type: "slug", current: slug },
      ...(s.city ? { city: s.city } : {}),
      ...(s.tagline ? { tagline: s.tagline } : {}),
      displayInitials: true,
    });
    console.log(`  + ${s.name.padEnd(32)} → ${slug}`);
  }

  console.log("\n💿 Pass — CU4TRO per-track credit injection\n");

  // Resolve CU4TRO release + person refs once
  const rel = await c.fetch(`*[_type=='release' && slug.current=='rtj-cu4tro-2023'][0]{ _id, "tracks": tracklist[].title, credits }`);
  if (!rel) { console.log("✗ CU4TRO release not found"); return; }

  const personCache = new Map<string, string>();
  const resolvePerson = async (name: string) => {
    const k = name.toLowerCase();
    if (personCache.has(k)) return personCache.get(k)!;
    const id = await c.fetch(`*[_type == "artist" && lower(name) == lower($name)][0]._id`, { name });
    if (id) personCache.set(k, id);
    return id ?? null;
  };

  const existing: any[] = rel.credits ?? [];
  const sigOf = (cr: any) => `${(cr.role ?? "").toLowerCase()}|${(cr.person?._ref ?? cr.name ?? "").toLowerCase()}|${(cr.tracks ?? []).join(",")}`;
  const existingSigs = new Set(existing.map(sigOf));

  const newCredits: any[] = [];
  let added = 0, skipped = 0, missing = 0;

  for (const tp of TRACK_PRODUCERS) {
    // Find the Sanity track title that matches our fragment
    const trackTitle = rel.tracks.find((t: string) => t.toLowerCase().includes(tp.match.toLowerCase()));
    if (!trackTitle) {
      console.log(`  ✗ MATCH MISS: "${tp.match}" — no track title contains this`);
      missing++;
      continue;
    }

    for (const producerName of tp.producers) {
      const ref = await resolvePerson(producerName);
      if (!ref) {
        console.log(`  ✗ ${producerName} not found in Sanity (stub creation may have failed)`);
        missing++;
        continue;
      }
      const cr = {
        _key: randomBytes(6).toString("hex"),
        role: "Co-produced by",
        person: { _type: "reference", _ref: ref },
        tracks: [trackTitle],
      };
      if (existingSigs.has(sigOf(cr))) {
        skipped++;
        continue;
      }
      newCredits.push(cr);
      added++;
      console.log(`  + Co-produced by ${producerName.padEnd(28)} → ${trackTitle.slice(0, 60)}…`);
    }
  }

  if (newCredits.length === 0) {
    console.log("\n· nothing to add (all credits already present)");
    return;
  }

  await c.patch(rel._id).set({ credits: [...existing, ...newCredits] }).commit();
  console.log(`\n✅ ${added} per-track credits added · ${skipped} already there · ${missing} missing\n`);
  console.log("→ Visit /releases/rtj-cu4tro-2023, click a track's '▾ cast' button. Each song's version producer pops out scoped to that song only.");
})();
