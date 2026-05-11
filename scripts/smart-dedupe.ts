/**
 * Smart dedupe across the full release catalog. For each (normalized title +
 * year) group, keep the entry with the most complete data, delete the rest.
 *
 * Score = number of populated quality fields:
 *   +3 if has cover
 *   +2 if has tracklist
 *   +2 if has releaseDate (day precision)
 *   +1 if has credits
 *   +1 if has bandcampUrl
 *   +1 if has notes
 *   +1 if NOT a release-discogs-* doc (prefer the migration/manual ones)
 *
 * Idempotent.
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

type Row = {
  _id: string;
  title: string;
  year?: number;
  cover?: unknown;
  tracklistLen: number;
  creditsLen: number;
  releaseDate?: string;
  bandcampUrl?: string;
  notesLen: number;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(lp|ep|single|remixes|edition|mixtape|extended|album)$/, "");

function score(r: Row): number {
  let s = 0;
  if (r.cover) s += 3;
  if (r.tracklistLen > 0) s += 2;
  if (r.releaseDate) s += 2;
  if (r.creditsLen > 0) s += 1;
  if (r.bandcampUrl) s += 1;
  if (r.notesLen > 0) s += 1;
  if (!r._id.startsWith("release-discogs-")) s += 1;
  if (r._id.startsWith("release-cc") || r._id.startsWith("release-ldcc") || r._id.startsWith("release-clm") || r._id.startsWith("release-hookemon")) s += 5; // C+C catalog wins
  return s;
}

async function main() {
  const rows = await client.fetch<Row[]>(`
    *[_type == "release" && defined(title) && defined(year)]{
      _id, title, year, cover,
      "tracklistLen": count(tracklist),
      "creditsLen": count(credits),
      releaseDate, bandcampUrl,
      "notesLen": count(notes)
    }
  `);
  console.log(`📚 ${rows.length} releases total`);

  // Group by normalized title + year.
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${norm(r.title)}|${r.year}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const toDelete: { id: string; title: string; year?: number; keptId: string }[] = [];
  for (const [, list] of groups) {
    if (list.length <= 1) continue;
    // Sort by score desc; keep best.
    list.sort((a, b) => score(b) - score(a));
    const keep = list[0];
    for (const r of list.slice(1)) {
      toDelete.push({ id: r._id, title: r.title, year: r.year, keptId: keep._id });
    }
  }

  console.log(`\n🗑  ${toDelete.length} duplicates to delete\n`);
  for (const d of toDelete) {
    try {
      await client.delete(d.id);
      console.log(`  - ${d.id.padEnd(48)} (kept ${d.keptId})`);
    } catch (err) {
      console.warn(`  ⚠ ${d.id}: ${(err as Error).message.slice(0, 50)}`);
    }
  }

  console.log(`\n✅ ${toDelete.length} dupes removed · ${rows.length - toDelete.length} unique releases remain`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
