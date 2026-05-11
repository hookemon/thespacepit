/**
 * Import gaps from Nick's master discography spreadsheet into Sanity.
 *
 * Read /tmp/master-albums.json (extracted from the XLSX), match against
 * existing Sanity releases by fuzzy title+year, create missing ones with
 * artist refs + tracklist + label.
 *
 * Idempotent — uses deterministic IDs.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve as resolvePath } from "path";

config({ path: resolvePath(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Album = {
  title: string;
  artist: string;
  label: string;
  catno: string;
  year: number;
  releaseDate: string;
  tracks: string[];
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Map the master label strings → our schema enum (or "Other").
function mapLabel(raw: string): string {
  const t = raw.toUpperCase();
  if (t === "CALM + COLLECT") return "Calm + Collect";
  if (t.startsWith("HOOKEMON")) return "Hookemon";
  if (t.includes("LOCKHART DYNASTY")) return "Lockhart Dynasty × Calm + Collect";
  if (t === "CALM + COLLECT INSTRUMENTAL" || t.includes("INSTRUMENTAL")) return "Calm + Collect Instrumental";
  if (t === "CALLLM") return "Calllm";
  return "Other";
}

function titleCase(s: string): string {
  // master file uses ALL CAPS — turn into nice title case while preserving the obvious.
  return s
    .split(" ")
    .map((w) => {
      const lc = w.toLowerCase();
      if (["of", "the", "a", "an", "in", "on", "and", "for", "to", "vs"].includes(lc)) return lc;
      return lc.charAt(0).toUpperCase() + lc.slice(1);
    })
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

async function ensureArtist(rawName: string): Promise<string> {
  const cleaned = rawName.replace(/\s+/g, " ").trim();
  const display = titleCase(cleaned);
  const slug = slugify(cleaned);
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && (slug.current == $slug || lower(name) == $lower)][0]{ _id }`,
    { slug, lower: display.toLowerCase() }
  );
  if (existing) return existing._id;
  const _id = `artist-ext-${slug}`;
  await client.createIfNotExists({
    _id,
    _type: "artist",
    name: display,
    slug: { _type: "slug", current: slug },
    onLabel: false,
  });
  return _id;
}

async function existingByTitleYear(title: string, year: number): Promise<{ _id: string; title: string; year?: number } | null> {
  // Loose match: normalize + look across ±1 year window for resilience against
  // reissue date drift.
  const target = normTitle(title);
  const rows = await client.fetch<{ _id: string; title: string; year?: number; norm: string }[]>(`
    *[_type == "release" && defined(year) && year >= $low && year <= $high]{
      _id, title, year, "norm": lower(title)
    }
  `, { low: year - 1, high: year + 1 });
  for (const r of rows) {
    if (normTitle(r.title) === target) return r;
  }
  return null;
}

function trackBlock(label: string, key: string) {
  return {
    _type: "track",
    _key: key,
    title: label,
  };
}

async function main() {
  const albums = JSON.parse(readFileSync("/tmp/master-albums.json", "utf-8")) as Album[];
  console.log(`📚 ${albums.length} albums in master spreadsheet\n`);

  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const a of albums) {
    const displayTitle = titleCase(a.title);
    const hit = await existingByTitleYear(a.title, a.year);

    if (hit) {
      // Already exists — touch up releaseDate + catalog number if missing.
      const patch: Record<string, unknown> = {};
      if (a.releaseDate) patch.releaseDate = a.releaseDate;
      if (a.catno) patch.catalogNumber = a.catno;
      if (Object.keys(patch).length > 0) {
        await client.patch(hit._id).setIfMissing(patch).commit();
      }
      skipped += 1;
      continue;
    }

    // Create the release with tracklist.
    const primaryArtistId = await ensureArtist(a.artist);
    const slug = slugify(`${displayTitle}-${a.year}`);
    const _id = `release-mdg-${slugify(displayTitle)}-${a.year}`;
    const label = mapLabel(a.label);

    await client.createOrReplace({
      _id,
      _type: "release",
      title: displayTitle,
      slug: { _type: "slug", current: slug },
      year: a.year,
      releaseDate: a.releaseDate,
      label,
      ...(a.catno ? { catalogNumber: a.catno } : {}),
      ...(label === "Other" && a.label ? { tagline: a.label } : {}),
      artists: [{ _type: "reference", _key: "a0", _ref: primaryArtistId }],
      tracklist: a.tracks.map((t, i) => trackBlock(titleCase(t), `t${i}`)),
    });

    console.log(`  + ${a.year}  [${label.slice(0, 12).padEnd(12)}]  ${displayTitle.slice(0, 45).padEnd(45)}  · ${a.tracks.length} tracks`);
    added += 1;
  }

  console.log(`\n✅ ${added} new releases · ${skipped} already existed · ${updated} updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
