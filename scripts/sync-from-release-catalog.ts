/**
 * Master sync from the Drive Release Catalog → Sanity.
 *
 * For each Drive release:
 *   1. Try to match an existing Sanity release by title (normalized + fuzzy).
 *   2. If matched → patch tracklist + credits + releaseDate.
 *   3. If not → CREATE the release doc (label="Other"), creating any missing
 *      artist docs along the way (with deterministic IDs so re-runs are idempotent).
 *
 * After this lands, every release in the Drive catalog has a corresponding
 * Sanity doc — no more "1991 by Azealia Banks is missing" gaps.
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

// ---------- types ----------

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

// ---------- normalization ----------

function normTitle(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[‘’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normName(s: string): string {
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

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Generate fuzzy variants of a title to widen matching.
 * Returns the original normalized form first, then progressively looser variants.
 */
function titleVariants(title: string): string[] {
  const variants = new Set<string>();
  const base = normTitle(title);
  variants.add(base);

  // Strip common suffixes (do iteratively in case of nested)
  const SUFFIX_PATTERNS = [
    /\s+ep$/, /\s+lp$/, /\s+single$/, /\s+mixtape$/,
    /\s+remixes$/, /\s+the remixes$/, /\s+plus remixes$/,
    /\s+extended edition$/,
  ];
  let stripped = base;
  for (let i = 0; i < 3; i++) {
    let changed = false;
    for (const p of SUFFIX_PATTERNS) {
      const next = stripped.replace(p, "").trim();
      if (next !== stripped) { stripped = next; changed = true; }
    }
    if (changed) variants.add(stripped);
    else break;
  }

  // Strip everything in trailing parentheses ("Tardes De Verano (Polybiu$ Remix)")
  const noParen = base.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (noParen !== base) variants.add(noParen);

  // Digit ↔ word swaps
  const swaps: Array<[RegExp, string]> = [
    [/\b4\b/g, "for"], [/\bfor\b/g, "4"],
    [/\b2\b/g, "two"], [/\btwo\b/g, "2"],
    [/\b1\b/g, "one"], [/\bone\b/g, "1"],
  ];
  for (const v of [...variants]) {
    for (const [pat, rep] of swaps) {
      const swapped = v.replace(pat, rep);
      if (swapped !== v) variants.add(swapped);
    }
  }

  return [...variants];
}

// ---------- artist resolution + creation ----------

const ALIAS_OVERRIDES: Record<string, string> = {
  "nicholas conceller": "nick-hook",
  "nicholas andrew conceller": "nick-hook",
  "conceller nicholas andrew": "nick-hook",
  "nick hook": "nick-hook",
  "nicholas hook": "nick-hook",
  "men women": "men-women-children-band", // bandname split bug fallback
  "men women children": "men-women-children-band",
  "men women & children": "men-women-children-band",
};

type ArtistRow = { _id: string; name: string; slug: string };

class ArtistResolver {
  private byName = new Map<string, ArtistRow>();

  async load() {
    const all: ArtistRow[] = await client.fetch(`*[_type == "artist"] { _id, name, "slug": slug.current }`);
    for (const a of all) this.byName.set(normName(a.name), a);
    for (const [alias, slug] of Object.entries(ALIAS_OVERRIDES)) {
      const a = all.find(x => x.slug === slug);
      if (a) this.byName.set(normName(alias), a);
    }
  }

  /** Look up an artist by name; create a stub artist doc if missing. */
  async resolveOrCreate(rawName: string): Promise<ArtistRow> {
    const norm = normName(rawName);
    const existing = this.byName.get(norm);
    if (existing) return existing;

    const slug = slugify(rawName);
    const id = `artist-ext-${slug}`;
    const created: ArtistRow = { _id: id, name: rawName, slug };
    await client.createIfNotExists({
      _id: id,
      _type: "artist",
      name: rawName,
      slug: { _type: "slug", current: slug },
      onLabel: false,
    });
    this.byName.set(norm, created);
    return created;
  }
}

// ---------- credit/track building ----------

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

async function buildCredits(rel: DriveRelease, resolver: ArtistResolver, primaryNames: Set<string>) {
  const out: Array<{ _key: string; role: string; person?: any; name?: string }> = [];
  const seen = new Set<string>();

  const add = async (role: string, name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const norm = normName(trimmed);
    if (primaryNames.has(norm)) return; // don't credit the band as contributor on their own record
    const a = resolver["byName"].get(norm); // private peek to avoid creating noise
    const dedupeKey = `${role}:${a?._id ?? norm}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    out.push({
      _key: `cr-${out.length}`,
      role,
      ...(a ? { person: { _type: "reference", _ref: a._id } } : { name: trimmed }),
    });
  };

  for (const c of rel.composers || []) await add("songwriter", c);
  for (const f of rel.features || []) for (const part of f.split(/\s*\/\s*/)) await add("feature", part);
  for (const r of rel.remixers || []) await add("remix", r);

  return out;
}

// ---------- main ----------

(async () => {
  if (!existsSync(DATA_PATH)) {
    console.error(`\n❌ ${DATA_PATH} not found. Run scripts/_parse-release-catalog.py first.\n`);
    process.exit(1);
  }
  const catalog: DriveCatalog = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  console.log(`\n🎼 Drive Release Catalog → Sanity SYNC (${Object.keys(catalog).length} releases in source)\n`);

  const resolver = new ArtistResolver();
  await resolver.load();

  // Build a fuzzy-match index of Sanity releases.
  const sanityReleases: { _id: string; title: string; year?: number; releaseDate?: string }[] =
    await client.fetch(`*[_type == "release" && defined(title)] { _id, title, year, releaseDate }`);

  const indexByVariant = new Map<string, typeof sanityReleases[0]>();
  for (const r of sanityReleases) {
    for (const v of titleVariants(r.title)) {
      if (!indexByVariant.has(v)) indexByVariant.set(v, r);
    }
  }
  console.log(`   loaded ${sanityReleases.length} Sanity releases · ${indexByVariant.size} title variants indexed`);
  console.log("");

  let patched = 0, created = 0, untouched = 0;
  const createdList: string[] = [];

  for (const [, rel] of Object.entries(catalog)) {
    // Try every variant of the Drive release title against the index.
    let target = null as typeof sanityReleases[0] | null;
    for (const v of titleVariants(rel.title)) {
      target = indexByVariant.get(v) ?? null;
      if (target) break;
    }

    // Resolve / create primary artists (always do this — they may need creating
    // for credit dedup logic to work).
    const primaryArtistRefs: { _type: "reference"; _ref: string; _key: string }[] = [];
    const primaryNamesNorm = new Set<string>();
    for (let i = 0; i < (rel.primaryArtists ?? []).length; i++) {
      const name = rel.primaryArtists![i];
      const a = await resolver.resolveOrCreate(name);
      primaryArtistRefs.push({ _type: "reference", _ref: a._id, _key: `a-${i}` });
      primaryNamesNorm.add(normName(name));
    }

    const tracklist = buildTracklist(rel.tracks);
    const credits = await buildCredits(rel, resolver, primaryNamesNorm);

    if (target) {
      // Patch existing
      const patchSet: Record<string, any> = {};
      if (tracklist.length) patchSet.tracklist = tracklist;
      if (credits.length) patchSet.credits = credits;
      if (rel.releaseDate && !target.releaseDate) patchSet.releaseDate = rel.releaseDate;
      if (rel.year && !target.year) patchSet.year = rel.year;
      if (Object.keys(patchSet).length === 0) { untouched++; continue; }
      await client.patch(target._id).set(patchSet).commit();
      patched++;
    } else {
      // CREATE — deterministic ID so re-runs are idempotent.
      const slug = slugify(rel.title);
      const newId = `release-ext-${slug}`;
      await client.createIfNotExists({
        _id: newId,
        _type: "release",
        title: rel.title,
        slug: { _type: "slug", current: slug },
        ...(rel.labelCatalog ? { catalogNumber: rel.labelCatalog } : {}),
        ...(rel.year ? { year: rel.year } : {}),
        ...(rel.releaseDate ? { releaseDate: rel.releaseDate } : {}),
        label: "Other",
        artists: primaryArtistRefs,
        ...(tracklist.length ? { tracklist } : {}),
        ...(credits.length ? { credits } : {}),
      });
      // The above won't overwrite existing fields, but new docs get full payload.
      // Re-patch to ensure tracklist/credits sync on a re-run.
      await client.patch(newId).set({
        tracklist,
        credits,
        ...(rel.releaseDate ? { releaseDate: rel.releaseDate } : {}),
        ...(rel.year ? { year: rel.year } : {}),
      }).commit();
      created++;
      createdList.push(`${rel.title}  ←  ${(rel.primaryArtists ?? []).join(" · ") || "—"}  (${rel.releaseDate ?? "?"})`);
    }
  }

  console.log(`\n✅ patched ${patched}  ·  created ${created} new release docs  ·  ${untouched} unchanged\n`);
  if (created > 0) {
    console.log(`NEW IN SANITY:`);
    createdList.forEach(c => console.log(`   + ${c}`));
    console.log("");
  }
})();
