/**
 * Import any release from Nick's Discogs that's not already in Sanity. Each
 * gets a release doc with label="Other" and Nick credited per the role.
 *
 * Skips entries that look like dupes of existing C+C/Hookemon records.
 *
 * Idempotent — uses deterministic _id (release-discogs-{id}) so re-runs are safe.
 *
 * Run: npx tsx scripts/import-discogs.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Map Discogs role → our display role.
const ROLE_MAP: Record<string, string> = {
  "Producer":         "Produced by",
  "Co-producer":      "Co-produced by",
  "Mixed by":         "Mixed by",
  "Remix":            "Remix",
  "Appearance":       "Guest appearance",
  "TrackAppearance":  "Featured track",
  "DJ Mix":           "DJ Mix",
};

// Titles already covered under a different slug in Sanity. We skip these.
const KNOWN_DUPES = new Set([
  "Without You",                                          // hookemon001
  "Collage V1 / Official Serato Control Vinyl",           // CC012 variant
  "Head",                                                 // CC014
  "Can't Tell Me Nothing",                                // CC016
  "Jungle Juice Vol. 1",                                  // CC026
  "RTJ Cu4tro",                                           // release-ext-rtj-cu4tro
  "Meow The Jewels",                                      // release-ext-meow-the-jewels
  "FACT Mix 722",                                         // Nick's own mix — could become a mix doc instead
  "Okada 8000",                                           // already exists somewhere
]);

type DiscogsRelease = {
  id: number;
  role: string;
  artist: string;
  title: string;
  year: number;
  label?: string;
  resource_url?: string;
};

async function ensureArtist(name: string): Promise<string> {
  // Strip Discogs disambiguators like "Cassius (4)"
  const clean = name.replace(/\s*\(\d+\)\s*$/, "").trim();
  const slug = slugify(clean);
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && (slug.current == $slug || lower(name) == $lower)][0]{ _id }`,
    { slug, lower: clean.toLowerCase() }
  );
  if (existing) return existing._id;
  const _id = `artist-ext-${slug}`;
  await client.createIfNotExists({
    _id, _type: "artist", name: clean,
    slug: { _type: "slug", current: slug }, onLabel: false,
  });
  return _id;
}

async function main() {
  // Pull Discogs page
  const res = await fetch(
    "https://api.discogs.com/artists/2401021/releases?page=1&per_page=100&sort=year&sort_order=asc",
    { headers: { "user-agent": "spacepit-web/1.0" } }
  );
  if (!res.ok) { console.error("discogs fetch failed"); process.exit(1); }
  const data = (await res.json()) as { releases: DiscogsRelease[] };

  const nick = await client.fetch<{ _id: string }>(
    `*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`
  );
  if (!nick) { console.error("nick-hook artist not found"); process.exit(1); }

  console.log(`📀 ${data.releases.length} Discogs releases\n`);

  let added = 0;
  let skipped = 0;
  for (const r of data.releases) {
    // Skip "Main" — those are Nick's own records, already on his label.
    if (r.role === "Main") continue;

    // Skip known dupes (variant titles for records we already have).
    if (KNOWN_DUPES.has(r.title)) {
      console.log(`  · ${r.title.slice(0, 40)} (dupe, skipped)`);
      skipped += 1;
      continue;
    }

    // Skip entries with no year (can't sort properly).
    if (!r.year || r.year < 1990) {
      console.log(`  · ${r.title.slice(0, 40)} (no year)`);
      skipped += 1;
      continue;
    }

    const _id = `release-discogs-${r.id}`;
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{ _id }`, { id: _id }
    );
    if (existing) {
      console.log(`  · ${r.title.slice(0, 40)} (already imported)`);
      skipped += 1;
      continue;
    }

    // Resolve primary artist.
    const primaryArtistId = await ensureArtist(r.artist);
    const slug = slugify(`${r.title}-${r.year}`);
    const role = ROLE_MAP[r.role] ?? r.role;

    await client.createOrReplace({
      _id,
      _type: "release",
      title: r.title,
      slug: { _type: "slug", current: slug },
      year: r.year,
      label: "Other",
      ...(r.label ? { tagline: r.label } : {}),
      artists: [{ _type: "reference", _key: "a0", _ref: primaryArtistId }],
      credits: [{
        _type: "object",
        _key: "c-nick",
        role,
        person: { _type: "reference", _ref: nick._id },
      }],
    });

    console.log(`  + ${r.year}  [${r.role}]  ${r.artist.slice(0, 25)} — ${r.title.slice(0, 35)}`);
    added += 1;
  }

  console.log(`\n✅ ${added} added · ${skipped} skipped (dupes/Main/missing year)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
