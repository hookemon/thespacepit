/**
 * Patch tracklists + credits + releaseDate on every Sanity release that has a
 * matching entry in the Drive "NICK HOOK - Release Catalog" master sheet.
 *
 * Reads:  scripts/data/release-catalog-from-drive.json   (output of _parse-release-catalog.py)
 * Writes: every matching release in Sanity
 *
 * Matching: by normalized release TITLE (Drive uses label catalog numbers like
 * ATL549151CD, not our internal CC### — so title is the only stable key).
 *
 * For each match this script sets:
 *   - tracklist[]  : { title, feature?, note? } per Drive track row
 *   - credits[]    : songwriter credits (composers), feature credits, remix credits
 *                    — merged with whatever credits are already on the release
 *   - releaseDate  : earliest date across the release's tracks (YYYY-MM-DD)
 *   - year         : derived from releaseDate (only set if missing)
 *
 * Idempotent — running twice produces the same result.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DATA_PATH = resolve(process.cwd(), "scripts/data/release-catalog-from-drive.json");

type DriveTrack = {
  title: string;
  isrc?: string;
  iswc?: string;
  feature?: string;
  remixer?: string;
  composers?: string[];
  artists?: string[];
  trackDate?: string;
};

type DriveRelease = {
  title: string;
  label?: string;
  labelCatalog?: string;
  releaseDate?: string;
  year?: number;
  primaryArtists?: string[];
  tracks: DriveTrack[];
  composers: string[];
  features: string[];
  remixers: string[];
};

type DriveCatalog = Record<string, DriveRelease>;

// ---------- normalization (must match the Python parser) ----------

function normalizeTitle(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[‘’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\$\$/g, "ss")
    .replace(/\$/g, "s")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Names that appear in COMPOSER fields under Nick's legal name. Map them to
// the canonical artist doc.
const ALIAS_OVERRIDES: Record<string, string> = {
  "nicholas conceller": "nick-hook",
  "nicholas andrew conceller": "nick-hook",
  "conceller nicholas andrew": "nick-hook",
  "conceller, nicholas andrew": "nick-hook",
  "nick hook": "nick-hook",
  "nicholas hook": "nick-hook",
};

async function buildSlugMap(): Promise<Map<string, { slug: string; id: string; name: string }>> {
  const artists = await client.fetch<{ _id: string; name: string; slug: string }[]>(
    `*[_type == "artist"] { _id, name, "slug": slug.current }`
  );
  const map = new Map<string, { slug: string; id: string; name: string }>();
  for (const a of artists) {
    map.set(normalizeName(a.name), { slug: a.slug, id: a._id, name: a.name });
  }
  for (const [alias, slug] of Object.entries(ALIAS_OVERRIDES)) {
    const a = artists.find((x) => x.slug === slug);
    if (a) map.set(normalizeName(alias), { slug: a.slug, id: a._id, name: a.name });
  }
  return map;
}

function buildTracklist(tracks: DriveTrack[]) {
  return tracks.map((t, i) => {
    const note: string[] = [];
    if (t.remixer) note.push(`Remix: ${t.remixer}`);
    return {
      _key: `tr-${i}`,
      title: t.title,
      ...(t.feature ? { feature: t.feature } : {}),
      ...(note.length ? { note: note.join(" · ") } : {}),
    };
  });
}

function buildCredits(
  rel: DriveRelease,
  slugMap: Map<string, { slug: string; id: string; name: string }>,
  primaryArtistName?: string
) {
  const out: Array<{ _key: string; role: string; person?: any; name?: string }> = [];
  const seen = new Set<string>();
  const primaryNorm = primaryArtistName ? normalizeName(primaryArtistName) : null;

  const add = (role: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const norm = normalizeName(trimmed);
    if (primaryNorm && norm === primaryNorm) return;
    const hit = slugMap.get(norm);
    const dedupeKey = `${role}:${hit?.id ?? norm}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    out.push({
      _key: `cr-${out.length}`,
      role,
      ...(hit
        ? { person: { _type: "reference", _ref: hit.id } }
        : { name: trimmed }),
    });
  };

  // composers → "songwriter"
  for (const c of rel.composers || []) add("songwriter", c);
  // features → "feature"
  for (const f of rel.features || []) {
    // features sometimes come as "Big Body Bes / 2nd person" — split
    for (const part of f.split(/\s*\/\s*/)) add("feature", part);
  }
  // remixers → "remix"
  for (const r of rel.remixers || []) add("remix", r);

  return out;
}

function deriveYear(rel: DriveRelease): number | undefined {
  if (rel.year) return rel.year;
  if (rel.releaseDate) {
    const y = parseInt(rel.releaseDate.slice(0, 4));
    if (!isNaN(y)) return y;
  }
  return undefined;
}

(async () => {
  if (!existsSync(DATA_PATH)) {
    console.error(`\n❌ ${DATA_PATH} not found. Run scripts/_parse-release-catalog.py first.\n`);
    process.exit(1);
  }
  const catalog: DriveCatalog = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  console.log(`\n🎼 Drive Release Catalog → Sanity (${Object.keys(catalog).length} releases in source)\n`);

  const slugMap = await buildSlugMap();
  console.log(`   resolved ${slugMap.size} artist names → Sanity slugs`);

  const sanityReleases = await client.fetch<{ _id: string; title: string; year?: number; releaseDate?: string }[]>(
    `*[_type == "release" && defined(title)] { _id, title, year, releaseDate }`
  );
  const byTitle = new Map<string, { _id: string; title: string; year?: number; releaseDate?: string }>();
  for (const r of sanityReleases) {
    byTitle.set(normalizeTitle(r.title), r);
  }
  console.log(`   loaded ${sanityReleases.length} Sanity release docs`);
  console.log("");

  let patched = 0;
  let unmatched: string[] = [];
  let untouched = 0;

  for (const [key, rel] of Object.entries(catalog)) {
    const target = byTitle.get(key);
    if (!target) {
      unmatched.push(`${rel.title}  (${rel.label || "—"})`);
      continue;
    }

    const tracklist = buildTracklist(rel.tracks);
    const credits = buildCredits(rel, slugMap, rel.primaryArtists?.[0]);
    const year = deriveYear(rel);

    const patchSet: Record<string, any> = {};
    if (tracklist.length > 0) patchSet.tracklist = tracklist;
    if (credits.length > 0) patchSet.credits = credits;
    if (rel.releaseDate && !target.releaseDate) patchSet.releaseDate = rel.releaseDate;
    if (year && !target.year) patchSet.year = year;

    if (Object.keys(patchSet).length === 0) {
      untouched++;
      continue;
    }

    await client.patch(target._id).set(patchSet).commit();

    const flags = [
      tracklist.length ? `${tracklist.length}t` : "",
      credits.length ? `${credits.length}c` : "",
      patchSet.releaseDate ? "📅" : "",
      patchSet.year ? "Y" : "",
    ].filter(Boolean).join("·");
    console.log(`   ✓ ${target.title.padEnd(40).slice(0, 40)} [${flags}]`);
    patched++;
  }

  console.log(`\n✅ patched ${patched} releases  ·  ${untouched} already complete  ·  ${unmatched.length} unmatched\n`);
  if (unmatched.length) {
    console.log(`UNMATCHED (in Drive catalog but no Sanity release with that title):`);
    unmatched.forEach((u) => console.log(`   • ${u}`));
    console.log("");
  }
})();
