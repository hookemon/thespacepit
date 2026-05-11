/**
 * Patch every release's tracklist + credits from the parsed Dropbox catalog
 * metadata sheets (output of the xlsx-parser agent).
 *
 * Reads:  scripts/data/catalog-from-xlsx.json
 * Writes: every matching release in Sanity (tracklist[] + credits[])
 *
 * Resolves credit names → artist references when the name matches a known
 * artist slug; falls back to free-text `name` otherwise.
 *
 * Idempotent — running twice produces the same result.
 *
 * Roles mapping (xlsx → Sanity credit role):
 *   composers → "songwriter"
 *   lyricists → "lyrics"
 *   producers → "production"
 *   remixers  → "remix"
 *   publishers → "publishing"
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

const DATA_PATH = resolve(process.cwd(), "scripts/data/catalog-from-xlsx.json");

type ParsedRelease = {
  albumTitle?: string;
  mainArtist?: string;
  label?: string;
  year?: number;
  upc?: string;
  sourceFile?: string;
  sourceTemplate?: string;
  tracks?: Array<{
    n?: number;
    title: string;
    duration?: string;
    isrc?: string;
    remixer?: string;
    feature?: string;
  }>;
  credits?: {
    composers?: string[];
    lyricists?: string[];
    producers?: string[];
    remixers?: string[];
    publishers?: string[];
  };
};

type ParsedCatalog = Record<string, ParsedRelease> & { _skipped?: any[] };

// Build a normalized name → slug map from the Sanity artist list.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\$\$/g, "ss") // Mi$$il → missil
    .replace(/\$/g, "s") // $ as S
    .replace(/['’`]/g, "") // strip apostrophes
    .replace(/[^a-z0-9]+/g, " ") // collapse non-alphanum to space
    .trim()
    .replace(/\s+/g, " ");
}

// Common alias overrides (left = source-text variant, right = canonical Sanity slug).
// Add more as we discover them in the data.
const ALIAS_OVERRIDES: Record<string, string> = {
  "nick hook": "nick-hook",
  "nicholas conceller": "nick-hook", // Nick's legal name on songwriter splits
  "tiombe lockhart": "tiombe-lockhart",
  "gareth jones": "gareth-jones",
  "spiritual friendship": "spiritual-friendship",
  "cubic zirconia": "cubic-zirconia",
  "color film": "color-film",
  "men women children": "men-women-children-band",
  "men women and children": "men-women-children-band",
};

async function buildSlugMap(): Promise<Map<string, { slug: string; id: string; name: string }>> {
  const artists = await client.fetch<{ _id: string; name: string; slug: string }[]>(
    `*[_type == "artist"] { _id, name, "slug": slug.current }`
  );
  const map = new Map<string, { slug: string; id: string; name: string }>();
  for (const a of artists) {
    map.set(normalize(a.name), { slug: a.slug, id: a._id, name: a.name });
  }
  for (const [alias, slug] of Object.entries(ALIAS_OVERRIDES)) {
    const a = artists.find((x) => x.slug === slug);
    if (a) map.set(normalize(alias), { slug: a.slug, id: a._id, name: a.name });
  }
  return map;
}

function resolveCredit(
  name: string,
  slugMap: Map<string, { slug: string; id: string; name: string }>
): { role: string; person?: { _type: "reference"; _ref: string }; name?: string } {
  const hit = slugMap.get(normalize(name));
  if (hit) {
    return { role: "", person: { _type: "reference", _ref: hit.id } };
  }
  return { role: "", name };
}

function buildCredits(
  src: ParsedRelease["credits"],
  slugMap: Map<string, { slug: string; id: string; name: string }>,
  primaryArtistName?: string
) {
  if (!src) return [];
  const out: Array<{ _key: string; role: string; person?: any; name?: string }> = [];
  const seen = new Set<string>(); // dedupe role + (slug or name)
  const primaryNorm = primaryArtistName ? normalize(primaryArtistName) : null;

  const ROLE_MAP: Array<[keyof NonNullable<ParsedRelease["credits"]>, string]> = [
    ["producers", "production"],
    ["composers", "songwriter"],
    ["lyricists", "lyrics"],
    ["remixers", "remix"],
    ["publishers", "publishing"],
  ];

  for (const [srcKey, role] of ROLE_MAP) {
    const list = src[srcKey] || [];
    for (const raw of list) {
      const name = (raw || "").trim();
      if (!name) continue;
      const norm = normalize(name);
      // skip if this name IS the primary artist (don't credit the band as a contributor on their own record)
      if (primaryNorm && norm === primaryNorm) continue;
      const c = resolveCredit(name, slugMap);
      const dedupeKey = `${role}:${c.person?._ref ?? norm}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push({
        _key: `cr-${out.length}`,
        role,
        ...(c.person ? { person: c.person } : { name }),
      });
    }
  }
  return out;
}

function buildTracklist(tracks: ParsedRelease["tracks"]) {
  if (!tracks?.length) return [];
  return tracks.map((t, i) => ({
    _key: `tr-${i}`,
    title: t.title,
    ...(t.duration ? { duration: t.duration } : {}),
    ...(t.feature ? { feature: t.feature } : {}),
    ...(t.remixer ? { note: `Remix: ${t.remixer}` } : {}),
  }));
}

(async () => {
  if (!existsSync(DATA_PATH)) {
    console.error(`\n❌ ${DATA_PATH} not found. Run the xlsx parser first.\n`);
    process.exit(1);
  }

  const data: ParsedCatalog = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const skipped = data._skipped || [];
  delete (data as any)._skipped;

  console.log(`\n🎼 Patching tracklists + credits from xlsx (${Object.keys(data).length} releases)\n`);

  const slugMap = await buildSlugMap();
  console.log(`   ↪ resolved ${slugMap.size} artist names to Sanity slugs\n`);

  // Fetch all release IDs by catalog number for matching.
  const releases = await client.fetch<{ _id: string; catalogNumber: string; title: string }[]>(
    `*[_type == "release" && defined(catalogNumber)] { _id, catalogNumber, title }`
  );
  const byCatalog = new Map(releases.map((r) => [r.catalogNumber, r]));

  let patched = 0;
  let unmatched: string[] = [];

  for (const [catNum, parsed] of Object.entries(data)) {
    const target = byCatalog.get(catNum);
    if (!target) {
      unmatched.push(catNum);
      continue;
    }

    const tracklist = buildTracklist(parsed.tracks);
    const credits = buildCredits(parsed.credits, slugMap, parsed.mainArtist);

    if (tracklist.length === 0 && credits.length === 0) {
      console.log(`   ⏭  ${catNum} — no tracks or credits parsed; skipping`);
      continue;
    }

    await client
      .patch(target._id)
      .set({
        ...(tracklist.length > 0 ? { tracklist } : {}),
        ...(credits.length > 0 ? { credits } : {}),
      })
      .commit();

    const trMark = tracklist.length > 0 ? `${tracklist.length} tracks` : "—";
    const crMark = credits.length > 0 ? `${credits.length} credits` : "—";
    console.log(`   ✓ ${catNum.padEnd(14)} ${trMark.padEnd(12)} ${crMark.padEnd(12)} ${target.title}`);
    patched++;
  }

  console.log(`\n✅ done — patched ${patched}/${Object.keys(data).length} releases`);
  if (unmatched.length) {
    console.log(`\n⚠  ${unmatched.length} catalog numbers in xlsx with no matching release in Sanity:`);
    unmatched.forEach((c) => console.log(`     • ${c}`));
  }
  if (skipped.length) {
    console.log(`\nℹ  ${skipped.length} releases skipped by the xlsx parser:`);
    skipped.forEach((s: any) => console.log(`     • ${JSON.stringify(s)}`));
  }
  console.log("");
})();
