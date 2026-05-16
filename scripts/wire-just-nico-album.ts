/**
 * Wire Album II as "Just Nico" — working-title for Nick's second solo
 * LP. Pulls in the 10-track tracklist + every credit from the .docx Nick
 * shared (Nick Hook- Just Nico Album Credits.docx).
 *
 * Album-wide:
 *   - Mixed @ The artLab by Gareth Jones
 *   - Mastered @ Sterling Sound by Joe Laporta
 *   - Engineers: Leon Kelly, Kid Kreep, Danny Montoya, Superproducer, Nick Hook
 *   - Recorded at: thespacepit + The links (new delhi) + Tonala + Medellin
 *     Studios + TSP Medellin (Coolto) + Pinche Hype + The artLapi + Rio
 *     Claro + Hellywood Studio + IME Escuelas Técnicas
 *
 * Per-track credits stored in credits[] with `tracks: ["..."]` scope so
 * the release page renders them under their specific track when expanded.
 *
 * Run: npx tsx scripts/wire-just-nico-album.ts
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

const RELEASE_ID = "release-nick-hook-album-ii";

// Ensure an artist doc exists for every name we credit, so chips on the
// release page link properly. New stubs are created with onLabel=false.
const ARTISTS_TO_ENSURE: { id: string; name: string; slug: string }[] = [
  { id: "artist-andres-belloso", name: "Andres Belloso", slug: "andres-belloso" },
  { id: "artist-felisa-tambor", name: "Felisa Tambor", slug: "felisa-tambor" },
  { id: "artist-cassie-watson-francillon", name: "Cassie Watson Francillon", slug: "cassie-watson-francillon" },
  { id: "artist-henry-darthenay", name: "Henry D'Arthenay", slug: "henry-darthenay" },
  { id: "artist-adrian-terrazas-gonzalez", name: "Adrian Terrazas González", slug: "adrian-terrazas-gonzalez" },
  { id: "artist-liliana-romero-musica", name: "Liliana Romero Música", slug: "liliana-romero-musica" },
  { id: "artist-brodinski", name: "Brodinski", slug: "brodinski" },
  { id: "artist-pawmps", name: "Pawmps", slug: "pawmps" },
  { id: "artist-gangsta-boo", name: "Gangsta Boo", slug: "gangsta-boo" },
  { id: "artist-doug-surreal", name: "Doug Surreal", slug: "doug-surreal" },
  { id: "artist-ghetto-living", name: "Ghetto Living", slug: "ghetto-living" },
  { id: "artist-ruben-jaramillo", name: "Rubén Jaramillo", slug: "ruben-jaramillo" },
  { id: "artist-el-trill", name: "El Trill", slug: "el-trill" },
  { id: "artist-kid-kreep", name: "Kid Kreep", slug: "kid-kreep" },
  { id: "artist-apache", name: "Apache", slug: "apache" },
  { id: "artist-madstarbase", name: "MadStarBase", slug: "madstarbase" },
  { id: "artist-la-pardo", name: "La Pardo", slug: "la-pardo" },
  { id: "artist-pezcatore", name: "Pezcatore", slug: "pezcatore" },
  { id: "artist-chad-hugo", name: "Chad Hugo", slug: "chad-hugo" },
  { id: "artist-metricas-frias", name: "Metricas Frias", slug: "metricas-frias" },
  { id: "artist-guadalupe", name: "Guadalupe", slug: "guadalupe" },
  { id: "artist-yulian-percs", name: "Yulian Percs", slug: "yulian-percs" },
  { id: "artist-eva-peroni", name: "Eva Peroni", slug: "eva-peroni" },
  { id: "artist-chucho-llano", name: "Chucho Llano", slug: "chucho-llano" },
  { id: "artist-taso", name: "Taso", slug: "taso" },
  { id: "artist-tulliz", name: "Tulliz", slug: "tulliz" },
  { id: "artist-siids", name: "SIIDS", slug: "siids" },
  { id: "artist-lrel", name: "Lrel", slug: "lrel" },
  { id: "artist-lido-pimienta", name: "Lido Pimienta", slug: "lido-pimienta" },
  { id: "artist-fatboi-sharif", name: "Fatboi Sharif", slug: "fatboi-sharif" },
  { id: "artist-electrogenetic", name: "Electrogenetic", slug: "electrogenetic" },
  { id: "artist-byron-the-aquarius", name: "Byron The Aquarius", slug: "byron-the-aquarius" },
  { id: "artist-leon-kelly", name: "Leon Kelly", slug: "leon-kelly" },
  { id: "artist-danny-montoya", name: "Danny Montoya", slug: "danny-montoya" },
  { id: "artist-superproducer", name: "Superproducer", slug: "superproducer" },
];

async function ensureArtist(id: string, name: string, slug: string) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id },
  );
  if (existing) return false;
  await client.createOrReplace({
    _id: id,
    _type: "artist",
    name,
    slug: { _type: "slug", current: slug },
    onLabel: false,
  });
  return true;
}

// Track titles match the docx — keeping "Untitled XX" as working names
// since the album isn't titled yet. Track 2 IS "If The Glove Don't Fit"
// (overlap with the single — the album version + the single share a hook).
const TRACKLIST_TITLES = [
  "Intro Ft. Andres Belloso + Felisa Tambor",
  "If The Glove Don't Fit Ft. Pawmps + Gangsta Boo",
  "Untitled 03 Ft. Ghetto Living",
  "Untitled 04 Ft. Apache + Ghetto Living + Adrian Terrazas González",
  "Untitled 05 Ft. La Pardo + Pezcatore",
  "Untitled 06 Ft. Metricas Frias + Guadalupe",
  "Mantra Chants Ft. Liliana Romero Música + Spiritual Friendship",
  "Untitled 08 Ft. Tulliz, SIIDS + Lrel",
  "Untitled 09 Ft. Lido Pimienta + Liliana Romero Música",
  "Outro Ft. Fatboi Sharif + Guadalupe + Cassie Watson Francillon",
];

const TRACKLIST = TRACKLIST_TITLES.map((title) => ({
  _key: randomUUID(),
  _type: "track",
  title,
}));

// Per-track + album-wide credits. Each entry can scope to one or more
// track titles via `tracks: [...]`; album-wide entries leave `tracks`
// unset.
type CreditInput =
  | { role: string; personRef: string; tracks?: string[]; instrument?: string }
  | { role: string; name: string; tracks?: string[]; instrument?: string };

function makeCredit(c: CreditInput) {
  const base: Record<string, unknown> = {
    _key: randomUUID(),
    _type: "object",
    role: c.role,
  };
  if ("personRef" in c) base.person = { _type: "reference", _ref: c.personRef };
  else base.name = c.name;
  if (c.tracks) base.tracks = c.tracks;
  if (c.instrument) base.instrument = c.instrument;
  return base;
}

const t1 = TRACKLIST_TITLES[0];
const t2 = TRACKLIST_TITLES[1];
const t3 = TRACKLIST_TITLES[2];
const t4 = TRACKLIST_TITLES[3];
const t5 = TRACKLIST_TITLES[4];
const t6 = TRACKLIST_TITLES[5];
const t7 = TRACKLIST_TITLES[6];
const t8 = TRACKLIST_TITLES[7];
const t9 = TRACKLIST_TITLES[8];
const t10 = TRACKLIST_TITLES[9];

const CREDITS: CreditInput[] = [
  // ── Track 1: Intro Ft. Andres Belloso + Felisa Tambor
  { role: "Vocals", personRef: "artist-andres-belloso", tracks: [t1] },
  { role: "Vocals", personRef: "artist-felisa-tambor", tracks: [t1] },
  { role: "Harp", personRef: "artist-cassie-watson-francillon", tracks: [t1] },
  { role: "Guitar", personRef: "artist-henry-darthenay", tracks: [t1] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t1] },
  { role: "Flute / Ocarina / Percussion", personRef: "artist-liliana-romero-musica", tracks: [t1] },
  { role: "Produced by", personRef: "artist-brodinski", tracks: [t1] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t1] },

  // ── Track 2: If The Glove Don't Fit Ft. Pawmps + Gangsta Boo
  { role: "Vocals", personRef: "artist-pawmps", tracks: [t2] },
  { role: "Vocals", personRef: "artist-gangsta-boo", tracks: [t2] },
  { role: "Flute / Ocarina / Shells", personRef: "artist-liliana-romero-musica", tracks: [t2] },
  { role: "Produced by", personRef: "artist-doug-surreal", tracks: [t2] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t2] },

  // ── Track 3: Untitled 03 Ft. Ghetto Living
  { role: "Vocals", personRef: "artist-ghetto-living", tracks: [t3] },
  { role: "Tumbadoras / Triángulo / Guacharaca", personRef: "artist-ruben-jaramillo", tracks: [t3] },
  { role: "Guitar", personRef: "artist-henry-darthenay", tracks: [t3] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t3] },
  { role: "Vocal Production / Engineering", personRef: "artist-el-trill", tracks: [t3] },
  { role: "Produced by", personRef: "artist-doug-surreal", tracks: [t3] },
  { role: "Produced by", personRef: "artist-kid-kreep", tracks: [t3] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t3] },

  // ── Track 4: Apache Ft. Apache + Ghetto Living + Adrian Terrazas González
  { role: "Vocals", personRef: "artist-apache", tracks: [t4] },
  { role: "Vocals", personRef: "artist-ghetto-living", tracks: [t4] },
  { role: "Castañuelas / Triángulo", personRef: "artist-ruben-jaramillo", tracks: [t4] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t4] },
  { role: "Flute / Ocarina / Percussion", personRef: "artist-liliana-romero-musica", tracks: [t4] },
  { role: "Vocal Production / Engineering (Ghetto Living)", personRef: "artist-el-trill", tracks: [t4] },
  { role: "Produced by", personRef: "artist-madstarbase", tracks: [t4] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t4] },

  // ── Track 5: Untitled 05 Ft. La Pardo + Pezcatore
  { role: "Vocals", personRef: "artist-la-pardo", tracks: [t5] },
  { role: "Vocals", personRef: "artist-pezcatore", tracks: [t5] },
  { role: "Percussion", personRef: "artist-liliana-romero-musica", tracks: [t5] },
  { role: "Ewe", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t5] },
  { role: "Produced by", personRef: "artist-chad-hugo", tracks: [t5] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t5] },

  // ── Track 6: Untitled 06 Ft. Metricas Frias + Guadalupe
  { role: "Vocals", personRef: "artist-metricas-frias", tracks: [t6] },
  { role: "Vocals", personRef: "artist-guadalupe", tracks: [t6] },
  { role: "Percussion", personRef: "artist-yulian-percs", tracks: [t6] },
  { role: "Bass", personRef: "artist-eva-peroni", tracks: [t6] },
  { role: "Keys", personRef: "artist-chucho-llano", tracks: [t6] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t6] },
  { role: "Produced by", personRef: "artist-taso", tracks: [t6] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t6] },

  // ── Track 7: Mantra Chants Ft. Liliana Romero Música + Spiritual Friendship
  { role: "Vocals", personRef: "artist-liliana-romero-musica", tracks: [t7] },
  { role: "Flute / Ocarina / Birds / Percussion / Bowls", personRef: "artist-liliana-romero-musica", tracks: [t7] },
  // Spiritual Friendship is a project doc — credit as plain name so it
  // links to the group's project page later.
  { role: "Produced by", name: "Spiritual Friendship", tracks: [t7] },

  // ── Track 8: Untitled 08 Ft. Tulliz, SIIDS + Lrel
  { role: "Vocals", personRef: "artist-tulliz", tracks: [t8] },
  { role: "Vocals", personRef: "artist-siids", tracks: [t8] },
  { role: "Vocals", personRef: "artist-lrel", tracks: [t8] },
  { role: "Percussion", personRef: "artist-yulian-percs", tracks: [t8] },
  { role: "Guacharaca", personRef: "artist-ruben-jaramillo", tracks: [t8] },
  { role: "Bass", personRef: "artist-eva-peroni", tracks: [t8] },
  { role: "Keys", personRef: "artist-chucho-llano", tracks: [t8] },
  { role: "Harp", personRef: "artist-cassie-watson-francillon", tracks: [t8] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t8] },
  { role: "Flute / Ocarina", personRef: "artist-liliana-romero-musica", tracks: [t8] },
  { role: "Produced by", personRef: "artist-taso", tracks: [t8] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t8] },

  // ── Track 9: Untitled 09 Ft. Lido Pimienta + Liliana Romero Música
  { role: "Vocals", personRef: "artist-lido-pimienta", tracks: [t9] },
  { role: "Vocals", personRef: "artist-liliana-romero-musica", tracks: [t9] },
  { role: "Percussion", personRef: "artist-yulian-percs", tracks: [t9] },
  { role: "Bass", personRef: "artist-eva-peroni", tracks: [t9] },
  { role: "Harp", personRef: "artist-cassie-watson-francillon", tracks: [t9] },
  { role: "Keys", personRef: "artist-chucho-llano", tracks: [t9] },
  { role: "Synth", personRef: "artist-electrogenetic", tracks: [t9] },
  { role: "Synth", personRef: "artist-byron-the-aquarius", tracks: [t9] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t9] },
  { role: "Flute / Ocarina / Percussion", personRef: "artist-liliana-romero-musica", tracks: [t9] },
  { role: "Produced by", personRef: "artist-taso", tracks: [t9] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t9] },

  // ── Track 10: Outro Ft. Fatboi Sharif + Guadalupe + Cassie Watson Francillon
  { role: "Vocals", personRef: "artist-fatboi-sharif", tracks: [t10] },
  { role: "Vocals", personRef: "artist-guadalupe", tracks: [t10] },
  { role: "Water / Percussion", personRef: "artist-guadalupe", tracks: [t10] },
  { role: "Harp", personRef: "artist-cassie-watson-francillon", tracks: [t10] },
  { role: "Synth", personRef: "artist-byron-the-aquarius", tracks: [t10] },
  { role: "Sax", personRef: "artist-adrian-terrazas-gonzalez", tracks: [t10] },
  { role: "Flute / Ocarina / Percussion", personRef: "artist-liliana-romero-musica", tracks: [t10] },
  { role: "Produced by", personRef: "artist-nick-hook", tracks: [t10] },

  // ── ALBUM-WIDE
  { role: "Mixed by", personRef: "artist-gareth-jones", instrument: "The artLab" },
  { role: "Mastered by", personRef: "artist-joe-laporta", instrument: "Sterling Sound" },
  { role: "Engineer", personRef: "artist-leon-kelly" },
  { role: "Engineer", personRef: "artist-kid-kreep" },
  { role: "Engineer", personRef: "artist-danny-montoya" },
  { role: "Engineer", personRef: "artist-superproducer" },
  { role: "Engineer", personRef: "artist-nick-hook" },
  // Recording locations — multiple, each as its own row.
  { role: "Recorded at", name: "thespacepit", instrument: "Brooklyn" },
  { role: "Recorded at", name: "The links", instrument: "New Delhi" },
  { role: "Recorded at", name: "Tonala" },
  { role: "Recorded at", name: "Medellin Studios", instrument: "Medellín" },
  { role: "Recorded at", name: "TSP Medellín (Coolto)", instrument: "Medellín" },
  { role: "Recorded at", name: "Pinche Hype" },
  { role: "Recorded at", name: "The artLapi" },
  { role: "Recorded at", name: "Rio Claro" },
  { role: "Recorded at", name: "Hellywood Studio" },
  { role: "Recorded at", name: "IME Escuelas Técnicas" },
];

async function main() {
  // Ensure all artist docs we credit exist.
  let createdCount = 0;
  for (const a of ARTISTS_TO_ENSURE) {
    if (await ensureArtist(a.id, a.name, a.slug)) createdCount++;
  }
  console.log(`✓ ensured ${ARTISTS_TO_ENSURE.length} artist docs (${createdCount} newly created)`);

  // Build the artist references for the release's `artists[]` — primary
  // artist is Nick Hook (it's HIS album), everyone else is a featured
  // collaborator via the per-track credits.
  const ARTIST_REFS = [
    { _key: randomUUID(), _type: "reference", _ref: "artist-nick-hook" },
  ];

  // Patch the release.
  await client
    .patch(RELEASE_ID)
    .set({
      title: "Just Nico",
      slug: { _type: "slug", current: "just-nico" },
      tagline:
        "The second album. Working title: Just Nico. Ten tracks, every collaborator, the whole world built into one record.",
      tracklist: TRACKLIST,
      credits: CREDITS.map(makeCredit),
      artists: ARTIST_REFS,
      label: "Calm + Collect",
      year: 2027,
      format: "LP",
      featured: true,
      status: "upcoming",
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}:`);
  console.log(`  title    → Just Nico`);
  console.log(`  slug     → just-nico`);
  console.log(`  tracks   → ${TRACKLIST.length}`);
  console.log(`  credits  → ${CREDITS.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
