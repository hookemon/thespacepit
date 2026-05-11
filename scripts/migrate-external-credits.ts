/**
 * Migrate the 24 entries in app/_lib/production-credits.ts into real Sanity
 * release docs (with `label: "Other"`).
 *
 * Each external release gets:
 *   · primary artist refs (creating stubs as needed)
 *   · Nick Hook credited via credits[].person with the role from the source
 *   · year, label/imprint, notes (as Portable Text), URL → bandcampUrl
 *
 * Dedupes the source list so "Old English" (Producer + Mixed by) becomes ONE
 * release with two credits.
 *
 * Idempotent — uses deterministic _id keyed on slug+year. Re-runs update.
 *
 * Run:  npx tsx scripts/migrate-external-credits.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { PRODUCTION_CREDITS } from "../app/_lib/production-credits";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['"’]/g, "")
    .replace(/[×x]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Split a comma + "×" + " x " separated multi-artist string into individuals.
function splitArtists(s: string): string[] {
  return s
    .split(/\s*[×]\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Fold multiple credits for the same release into one record.
type Group = {
  key: string;
  title: string;
  year: number;
  artistsRaw: string;
  credits: { role: string; }[];
  label?: string;
  notes?: string;
  url?: string;
};

function groupCredits() {
  const groups = new Map<string, Group>();
  for (const c of PRODUCTION_CREDITS) {
    // De-dupe "Old English" + "Old English (mix)" into a single Old English.
    const cleanTitle = c.title.replace(/\s*\(mix\)\s*$/i, "").trim();
    const key = `${slugify(cleanTitle)}-${c.year}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: cleanTitle,
        year: c.year,
        artistsRaw: c.artist,
        credits: [],
        label: c.label,
        notes: c.notes,
        url: c.url,
      });
    }
    const g = groups.get(key)!;
    g.credits.push({ role: c.role });
    // Backfill any missing fields if this entry has them.
    if (!g.label && c.label) g.label = c.label;
    if (!g.notes && c.notes) g.notes = c.notes;
    if (!g.url && c.url) g.url = c.url;
  }
  return [...groups.values()];
}

async function ensureArtistByName(name: string): Promise<string> {
  const slug = slugify(name);
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && (slug.current == $slug || lower(name) == $lower)][0]{ _id }`,
    { slug, lower: name.toLowerCase() }
  );
  if (existing?._id) return existing._id;

  const _id = `artist-ext-${slug}`;
  await client.createIfNotExists({
    _id,
    _type: "artist",
    name,
    slug: { _type: "slug", current: slug },
    onLabel: false,
  });
  return _id;
}

async function getNickId(): Promise<string> {
  const nick = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`
  );
  if (!nick) {
    throw new Error("Nick Hook artist doc not found — seed the catalog first");
  }
  return nick._id;
}

function portableTextFromString(text: string) {
  return [
    {
      _type: "block",
      _key: "p0",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s0", text, marks: [] }],
    },
  ];
}

async function main() {
  const nickId = await getNickId();
  const groups = groupCredits();
  console.log(`📦 Migrating ${groups.length} external releases (folded from ${PRODUCTION_CREDITS.length} credits)\n`);

  for (const g of groups) {
    // Resolve all primary artists for this release
    const names = splitArtists(g.artistsRaw);
    const artistIds: string[] = [];
    for (const n of names) {
      artistIds.push(await ensureArtistByName(n));
    }

    const releaseId = `release-ext-${g.key}`;
    const credits = g.credits.map((c, i) => ({
      _type: "object",
      _key: `c-${i}`,
      role: c.role,
      person: { _type: "reference", _ref: nickId },
    }));

    // Build a tagline from the imprint label if present (e.g. "Fool's Gold").
    const tagline = g.label;
    const notes = g.notes ? portableTextFromString(g.notes) : undefined;

    const doc = {
      _id: releaseId,
      _type: "release",
      title: g.title,
      slug: { _type: "slug", current: g.key },
      year: g.year,
      label: "Other",
      ...(tagline ? { tagline } : {}),
      ...(g.url ? { bandcampUrl: g.url } : {}),
      ...(notes ? { notes } : {}),
      artists: artistIds.map((id, i) => ({
        _type: "reference",
        _key: `a-${i}`,
        _ref: id,
      })),
      credits,
    };

    await client.createOrReplace(doc);
    const rolesStr = g.credits.map((c) => c.role).join(" + ");
    console.log(`  ✓ ${g.title.padEnd(34, " ").slice(0, 34)} ${g.year}  ${rolesStr}`);
  }

  console.log(`\n✅ ${groups.length} external releases in Sanity. Nick is credited on each.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
