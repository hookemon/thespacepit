/* eslint-disable no-console */
/**
 * List tracks on releases where Nick Hook is credited (artist OR producer)
 * that don't yet have lyrics — these are candidates for Genius scraping.
 * Filter to releases where the PRIMARY ARTIST is a known Genius-indexed name
 * (Bronson, Flatbush Zombies, Big Boi, Bodega Bamz, etc.) so we don't waste
 * cycles on underground tracks Genius won't have.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// Major-label / mainstream-press artists Nick has worked with that Genius
// definitely indexes. Slug-style for matching, but we match by lowercased
// name substring.
const GENIUS_INDEXED = [
  "action bronson",
  "bronson",
  "flatbush zombies",
  "run the jewels",
  "rtj",
  "big boi",
  "young thug",
  "gangsta boo",
  "bodega bamz",
  "danny brown",
  "lucki",
  "novelist",
  "cadence weapon",
  "asap ferg",
  "a$ap ferg",
  "freddie gibbs",
  "fatman scoop",
  "bunji garlin",
  "wiki",
  "open mike eagle",
  "mc lars",
  "lido pimienta",
  "fatboi sharif",
  "el-p",
  "killer mike",
  "post malone",
  "machinedrum",
  "dj rashad",
];

async function main() {
  const rows = await client.fetch<
    Array<{
      _id: string;
      title: string;
      slug: string;
      year?: number;
      artists?: { name?: string }[];
      tracks?: { title?: string; hasLyrics: boolean; features?: string[] }[];
    }>
  >(`*[_type == "release" && (withdrawn != true)]{
    _id, title, "slug": slug.current, year,
    "artists": artists[]->{name},
    "tracks": tracklist[]{ title, "hasLyrics": defined(lyrics), features }
  } | order(year asc)`);

  // Filter to releases with at least one Genius-indexed-artist match
  const candidates = rows
    .map((r) => {
      const allArtists = (r.artists ?? []).map((a) => (a.name ?? "").toLowerCase());
      const hits = GENIUS_INDEXED.filter((n) => allArtists.some((a) => a.includes(n)));
      const tracksWithoutLyrics = (r.tracks ?? []).filter((t) => t.title && !t.hasLyrics);
      return { ...r, geniusHits: hits, candidateTracks: tracksWithoutLyrics };
    })
    .filter((r) => r.geniusHits.length > 0 && r.candidateTracks.length > 0);

  console.log(`\n${candidates.length} releases with Genius-indexed artists + tracks lacking lyrics:\n`);
  for (const c of candidates) {
    const artists = c.artists?.map((a) => a.name).join(" + ") ?? "—";
    console.log(`  [${c.year ?? "?"}] ${c.title} — ${artists}`);
    console.log(`    matched: ${c.geniusHits.join(", ")}`);
    console.log(`    slug: ${c.slug}`);
    for (const t of c.candidateTracks) {
      const feats = t.features?.length ? ` (ft. ${t.features.join(", ")})` : "";
      console.log(`      · ${t.title}${feats}`);
    }
    console.log("");
  }
  console.log(`\nTOTAL: ${candidates.reduce((s, c) => s + c.candidateTracks.length, 0)} candidate tracks`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
