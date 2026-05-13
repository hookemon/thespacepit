/**
 * Backfill artist bios from Wikipedia — STRICT VERSION.
 *
 * Approach: only fetch a Wikipedia article whose TITLE matches the artist
 * name (or a known disambiguation suffix). NO fuzzy search — that produced
 * too many false positives (Nick Hook → "Nick Hoffman", Color Film → "The
 * Color Purple", etc.).
 *
 * Match strategy for "Danny Brown":
 *   1. /page/summary/Danny_Brown             (top-level redirect — usually right person)
 *   2. /page/summary/Danny_Brown_(rapper)    (explicit disambig)
 *   3. /page/summary/Danny_Brown_(musician)
 *   4. /page/summary/Danny_Brown_(producer)
 *   5. /page/summary/Danny_Brown_(DJ)
 *   6. (give up — better to have no bio than the wrong one)
 *
 * Validation: even on a hit, we verify the summary describes a music figure
 * (terms like rapper / producer / musician / band) AND the Wikipedia title
 * is reasonably close to the artist name (skip if it's clearly a different
 * person — e.g. "Danny Joe Brown" when we asked for "Danny Brown").
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

const UA = "spacepit-web/1.0 (https://thespacepit.com) bio-scraper";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const FORCE      = process.argv.includes("--force");
const TOP        = arg("top") ? parseInt(arg("top")!, 10) : undefined;
const ONLY_SLUG  = arg("slug");

const DISAMBIGS = ["", "(musician)", "(rapper)", "(producer)", "(DJ)", "(band)", "(music producer)", "(artist)"];

const MUSIC_TERMS = [
  "musician", "rapper", "producer", "beatmaker", "vocalist",
  "singer", "songwriter", "DJ ", "deejay", "MC ", "emcee",
  "record label", "record producer", "music group",
  "hip hop", "hip-hop", "electronic", "techno", "house",
  "drum and bass", "footwork", "grime", "trap", "R&B", "soul music",
  "mixtape", "studio album", "music video", "discography", "music duo",
];

type WikipediaSummary = {
  type?: string;
  title: string;
  description?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
};

async function tryWiki(title: string): Promise<WikipediaSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    const d = (await res.json()) as WikipediaSummary;
    // Skip disambiguation pages — those are landing pages, not articles
    if (d.type === "disambiguation") return null;
    return d;
  } catch {
    return null;
  }
}

function isMusicRelated(text: string, description: string | undefined): boolean {
  const haystack = `${text}\n${description ?? ""}`.toLowerCase();
  return MUSIC_TERMS.some((t) => haystack.includes(t.toLowerCase()));
}

// Normalize a name for fuzzy comparison — lowercase, strip non-alphanum
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Verify the Wikipedia page is actually about the artist we asked for, not
 * a different person who happens to share part of the name. Three checks:
 *
 *  1. Normalized title must START WITH the normalized artist name, OR
 *  2. Normalized title equals the normalized name + a disambiguation, OR
 *  3. The extract opens with the artist's name (first 40 chars must contain it)
 *
 * This stops:
 *   - "Danny Joe Brown" (Molly Hatchet) being returned for "Danny Brown" (rapper)
 *   - "Nick Hoffman" being returned for "Nick Hook"
 *   - "Tassos" being returned for "Taso"
 */
function titleMatchesArtist(title: string, artist: string, extract: string): boolean {
  const tn = normalizeName(title);
  const an = normalizeName(artist);

  // Strip Wikipedia disambiguators from the comparison
  const titleClean = normalizeName(title.replace(/\s*\([^)]+\)\s*/g, ""));
  // exact (after removing disambig)
  if (titleClean === an) return true;
  // Starts-with — handles "Spank Rock (band)" matching "Spank Rock"
  if (titleClean.startsWith(an) && titleClean.length - an.length <= 4) return true;
  if (an.startsWith(titleClean) && an.length - titleClean.length <= 4) return true;

  // Last resort: extract opens with the artist name (e.g. "Danny Brown is...")
  const firstLine = extract.slice(0, 80).toLowerCase();
  if (firstLine.includes(artist.toLowerCase())) return true;

  return false;
  // titleMatch with full normalized — for symmetry / debugging
  void tn;
}

function toPortableText(text: string): unknown[] {
  const paragraphs = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const trimmed = paragraphs.length > 0 ? paragraphs : [text.trim()];
  return trimmed.map((p, i) => ({
    _type: "block",
    _key: `wiki-bio-${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `wiki-bio-${i}-s`, text: p, marks: [] }],
  }));
}

function tighten(text: string): string {
  // Pull first 3 sentences max — opens are usually the cleanest
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, 3).join("").trim();
}

type Artist = { _id: string; name: string; slug: string; hasBio: boolean; appearances: number; onLabel?: boolean };

async function main() {
  const rows = await sanity.fetch<Artist[]>(`
    *[_type == "artist"]{
      _id, name, "slug": slug.current, onLabel,
      "hasBio": defined(bio) && length(bio) > 0,
      "appearances": count(*[_type == "release" && (references(^._id) || count(credits[person._ref == ^.^._id]) > 0)])
    } | order(onLabel desc, appearances desc, name asc)
  `);

  let pool = rows;
  if (ONLY_SLUG) pool = pool.filter((a) => a.slug === ONLY_SLUG);
  else if (!FORCE) pool = pool.filter((a) => !a.hasBio);
  if (TOP) pool = pool.slice(0, TOP);

  console.log(`📚 ${pool.length} artists to process (strict mode)\n`);

  let wrote = 0, noPage = 0, wrongPerson = 0, notMusic = 0;
  for (const a of pool) {
    const label = `${a.onLabel ? "★" : " "} ${a.name.padEnd(28)}`;
    process.stdout.write(`  ${label} `);

    // Skip placeholder/garbage artist names — these will never have wiki pages
    if (/^(various|unknown|self|n\/a)$/i.test(a.name.trim()) || a.name.length < 2) {
      console.log("· placeholder name, skipping");
      continue;
    }

    let hit: { summary: WikipediaSummary; tried: string } | null = null;
    for (const disambig of DISAMBIGS) {
      const candidate = disambig ? `${a.name} ${disambig}` : a.name;
      const summary = await tryWiki(candidate);
      if (summary?.extract) {
        if (!titleMatchesArtist(summary.title, a.name, summary.extract)) continue;
        if (!isMusicRelated(summary.extract, summary.description)) continue;
        hit = { summary, tried: candidate };
        break;
      }
      // Tiny throttle between Wikipedia probes
      await new Promise((r) => setTimeout(r, 80));
    }

    if (!hit) {
      // Fail mode: figure out which check killed it. We didn't track per-step,
      // so just bucket as "no usable page"
      console.log("✗ no exact match");
      noPage += 1;
      continue;
    }

    const extract = tighten(hit.summary.extract!);
    const bio = toPortableText(extract);
    const tagline = hit.summary.description?.replace(/^(American|British|Canadian|English|Australian|French) /, "");

    const patch: Record<string, unknown> = { bio };
    if (tagline && tagline.length < 100) patch.tagline = tagline.toLowerCase();

    await sanity.patch(a._id).set(patch).commit();
    console.log(`✓ "${hit.summary.title}"`);
    wrote++;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n✅ ${wrote} bios written · ${noPage} no exact match · ${wrongPerson} wrong person · ${notMusic} not music`);
}
main().catch((err) => { console.error(err); process.exit(1); });
