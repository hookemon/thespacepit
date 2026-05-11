/**
 * Pull the ORIGINAL release date for every release that has a bandcampUrl,
 * write it to the new releaseDate field (and refresh year if it was wrong).
 *
 * Source: current.release_date in the data-tralbum JSON on each Bandcamp page.
 *
 * Idempotent. Run:
 *   npx tsx scripts/scrape-release-dates.ts            # only fill missing dates
 *   npx tsx scripts/scrape-release-dates.ts --force    # overwrite
 *   npx tsx scripts/scrape-release-dates.ts --slug=cc004-peephole
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

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

type ReleaseRow = {
  _id: string;
  title: string;
  slug: string;
  bandcampUrl?: string;
  year?: number;
  releaseDate?: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

// "13 Apr 2013 00:00:00 GMT" → "2013-04-13"
function parseBandcampDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchReleaseDate(url: string): Promise<{ date: string; year: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; spacepit-release-dates/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/data-tralbum="([^"]+)"/);
    if (!m) return null;
    const data = JSON.parse(decodeEntities(m[1])) as {
      current?: { release_date?: string; publish_date?: string };
    };
    const raw = data.current?.release_date ?? data.current?.publish_date;
    const iso = parseBandcampDate(raw);
    if (!iso) return null;
    return { date: iso, year: parseInt(iso.slice(0, 4), 10) };
  } catch (err) {
    console.warn(`  ⚠ ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const dateFilter = FORCE ? "" : "&& !defined(releaseDate)";

  const rows = await client.fetch<ReleaseRow[]>(`
    *[
      _type == "release"
      && defined(bandcampUrl)
      && (withdrawn != true)
      ${slugFilter}
      ${dateFilter}
    ] | order(catalogNumber asc) {
      _id, title, "slug": slug.current, bandcampUrl, year, releaseDate
    }
  `);

  if (rows.length === 0) {
    console.log("Nothing to do — every release with a Bandcamp URL already has a releaseDate.");
    return;
  }

  console.log(`📅 Scraping ${rows.length} release date${rows.length === 1 ? "" : "s"}...\n`);

  let ok = 0;
  let skipped = 0;
  let yearFixes = 0;
  for (const r of rows) {
    const label = r.title.padEnd(34, " ").slice(0, 34);
    process.stdout.write(`  ${label} `);

    const hit = await fetchReleaseDate(r.bandcampUrl!);
    if (!hit) {
      console.log("✗ no date");
      skipped += 1;
      continue;
    }

    const patch: Record<string, unknown> = { releaseDate: hit.date };
    // If the existing `year` is wrong, fix it too.
    if (r.year !== hit.year) {
      patch.year = hit.year;
      yearFixes += 1;
    }
    await client.patch(r._id).set(patch).commit();
    const change = r.year !== hit.year ? ` (year ${r.year ?? "—"} → ${hit.year})` : "";
    console.log(`✓ ${hit.date}${change}`);
    ok += 1;

    await new Promise((res) => setTimeout(res, 250));
  }

  console.log(`\n✅ ${ok} dates set · ${yearFixes} year corrections · ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
