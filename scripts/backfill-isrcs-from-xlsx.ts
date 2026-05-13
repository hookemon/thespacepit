/**
 * Backfill ISRCs onto Sanity track docs from the master discography xlsx.
 *
 * SOURCE: "NICK HOOK ENTIRE DISCOGRAPHY 2.0 (2).xlsx" — Nick's industry-grade
 * row-per-track export with ISRC, ISWC, IPI #s, BMI works, share splits,
 * label, catalog #. 429 rows, 292 with ISRC, 101 albums, 63 artists.
 *
 * Strategy (idempotent, runs safely as many times as you want):
 *   1. Parse the xlsx → list of { album, title, isrc, artist }
 *   2. For each Sanity release with a tracklist, find xlsx rows that match
 *      on normalized album title (lowercase, strip punctuation)
 *   3. For each track in the release, find the best-matching xlsx row by
 *      normalized track title
 *   4. If match + xlsx has ISRC + Sanity track doesn't already have one →
 *      patch it in
 *
 * Reports what matched, what was ambiguous, what was missing. Honest:
 *   · multi-version tracks (Dirty/Clean/Instrumental) can collide → resolved
 *     by scoring (titles closer in length match better)
 *   · pre-ISRC catalog (early MWC, etc.) just has no ISRC to write
 *
 * Run:
 *   npx tsx scripts/backfill-isrcs-from-xlsx.ts --dry-run    # preview
 *   npx tsx scripts/backfill-isrcs-from-xlsx.ts              # commit
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync, readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const XLSX_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/My Mac (Mac-mini)/Downloads/NICK HOOK ENTIRE DISCOGRAPHY 2.0 (2).xlsx";

interface XlsxRow {
  album: string;
  title: string;
  artist: string;
  isrc: string | null;
  label?: string;
  catalogNumber?: string;
  iswc?: string | null;
  bmiWorks?: string | null;
}

/**
 * Read the xlsx via a Python one-shot. Cleanest cross-language path —
 * openpyxl handles xlsx better than any node lib and we already have it
 * available locally.
 */
function readXlsx(): XlsxRow[] {
  const py = `
import json, sys
from openpyxl import load_workbook
wb = load_workbook(${JSON.stringify(XLSX_PATH)}, read_only=True)
ws = wb[wb.sheetnames[0]]
rows = list(ws.iter_rows(values_only=True))
header = list(rows[0])
idx = {name: header.index(name) for name in [
  'Album', 'Title', 'Artist', 'ISRC', 'Label', 'Label Catalog #', 'ISWC', 'BMI Works #'
] if name in header}
out = []
for r in rows[1:]:
  album = r[idx['Album']] if 'Album' in idx else None
  title = r[idx['Title']] if 'Title' in idx else None
  if not album or not title: continue
  out.append({
    'album': str(album),
    'title': str(title),
    'artist': str(r[idx['Artist']] or ''),
    'isrc': (str(r[idx['ISRC']]) if idx.get('ISRC') is not None and r[idx['ISRC']] else None),
    'label': (str(r[idx.get('Label')]) if idx.get('Label') is not None and r[idx['Label']] else None),
    'catalogNumber': (str(r[idx.get('Label Catalog #')]) if idx.get('Label Catalog #') is not None and r[idx['Label Catalog #']] else None),
    'iswc': (str(r[idx.get('ISWC')]) if idx.get('ISWC') is not None and r[idx['ISWC']] else None),
    'bmiWorks': (str(r[idx.get('BMI Works #')]) if idx.get('BMI Works #') is not None and r[idx['BMI Works #']] else None),
  })
print(json.dumps(out))
`;
  const tmp = "/tmp/spacepit-xlsx-read.py";
  writeFileSync(tmp, py);
  try {
    const json = execSync(`python3 ${tmp}`, { maxBuffer: 50_000_000 }).toString();
    return JSON.parse(json) as XlsxRow[];
  } finally {
    unlinkSync(tmp);
  }
}

/** Strip everything but a-z0-9 + single spaces. Case-insensitive. */
function norm(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A track-title scoring function that's gentle with edge cases:
 *  - exact normalized match → 10
 *  - one contains the other → 5 + length-similarity bonus
 *  - shared first 3 words → 2
 *  - else → 0 */
function scoreTitle(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 10;
  if (na.includes(nb) || nb.includes(na)) {
    // The closer the lengths, the higher the bonus (avoids "X" matching "X Remix Extended Mix Sundream Edition")
    const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
    return 5 + ratio * 3;
  }
  const wa = na.split(" ");
  const wb = nb.split(" ");
  const head = wa.slice(0, 3).join(" ");
  if (head && nb.startsWith(head)) return 2;
  if (head && wb.slice(0, 3).join(" ") === head) return 2;
  return 0;
}

interface SanityRelease {
  _id: string;
  title: string;
  slug: string;
  tracklist?: { _key: string; title: string; isrc?: string }[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  console.log(`\n→ Reading xlsx…`);
  const xlsxRows = readXlsx().filter((r) => r.isrc); // only rows with an ISRC are useful
  console.log(`  ${xlsxRows.length} rows with ISRC across ${new Set(xlsxRows.map((r) => norm(r.album))).size} unique albums`);

  console.log(`\n→ Reading Sanity releases with tracklists…`);
  const releases = await c.fetch<SanityRelease[]>(`
    *[_type == "release" && count(tracklist) > 0]{
      _id, title, "slug": slug.current,
      "tracklist": tracklist[]{ _key, title, isrc }
    }
  `);
  console.log(`  ${releases.length} releases with tracklists`);

  // Group xlsx rows by normalized album title for fast lookup
  const xlsxByAlbum = new Map<string, XlsxRow[]>();
  for (const r of xlsxRows) {
    const k = norm(r.album);
    const arr = xlsxByAlbum.get(k) ?? [];
    arr.push(r);
    xlsxByAlbum.set(k, arr);
  }

  // Stats
  let isrcWritten = 0;
  let isrcSkippedExisting = 0;
  let tracksUnmatched = 0;
  let releasesUnmatched = 0;
  const ambiguousReleases: string[] = [];

  for (const release of releases) {
    const releaseNorm = norm(release.title);
    // Try exact normalized match first; if none, try fuzzy (release norm ⊂ xlsx OR vice versa)
    let xlsxCandidates = xlsxByAlbum.get(releaseNorm);
    if (!xlsxCandidates || xlsxCandidates.length === 0) {
      // Fuzzy fallback — find any xlsx album that contains the release title or vice versa
      for (const [k, v] of xlsxByAlbum.entries()) {
        if (releaseNorm && (k.includes(releaseNorm) || releaseNorm.includes(k))) {
          xlsxCandidates = v;
          break;
        }
      }
    }
    if (!xlsxCandidates || xlsxCandidates.length === 0) {
      releasesUnmatched++;
      continue;
    }

    // For each Sanity track, find the best-scoring xlsx row
    const patches: { _key: string; isrc: string }[] = [];
    for (const t of release.tracklist ?? []) {
      if (t.isrc) {
        isrcSkippedExisting++;
        continue;
      }
      let best: { row: XlsxRow; score: number } | null = null;
      for (const row of xlsxCandidates) {
        const score = scoreTitle(t.title, row.title);
        if (!best || score > best.score) best = { row, score };
      }
      if (best && best.score >= 5 && best.row.isrc) {
        patches.push({ _key: t._key, isrc: best.row.isrc });
      } else {
        tracksUnmatched++;
      }
    }

    if (patches.length === 0) {
      ambiguousReleases.push(release.title);
      continue;
    }

    console.log(`  ✓ ${release.title.padEnd(40).slice(0, 40)} +${patches.length} ISRC${patches.length === 1 ? "" : "s"}`);
    isrcWritten += patches.length;

    if (!dryRun) {
      // Patch each track's isrc by _key
      let patch = c.patch(release._id);
      for (const p of patches) {
        patch = patch.set({ [`tracklist[_key=="${p._key}"].isrc`]: p.isrc });
      }
      await patch.commit();
    }
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  ISRCs written:                ${isrcWritten}`);
  console.log(`  tracks that already had ISRC: ${isrcSkippedExisting}`);
  console.log(`  tracks no xlsx match:         ${tracksUnmatched}`);
  console.log(`  releases unmatched in xlsx:   ${releasesUnmatched}`);
  console.log(`  releases scored but no tracks tied: ${ambiguousReleases.length}`);
  if (dryRun) console.log(`\n  (DRY RUN — no Sanity writes.)`);

  if (ambiguousReleases.length > 0 && ambiguousReleases.length < 30) {
    console.log(`\n  unmatched releases (album in xlsx but no track-title overlap):`);
    for (const t of ambiguousReleases) console.log(`    · ${t}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
