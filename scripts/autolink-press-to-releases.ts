/* eslint-disable no-console */
/**
 * Auto-link orphan press pieces to releases by fuzzy-matching the release
 * title or catalog number against the press piece's headline, quote, or
 * URL.
 *
 * Why: lots of historical press exists but `relatedRelease` was never set
 * during import, so 100 releases show 0 press on their detail page even
 * though there's a write-up in Sanity that references them.
 *
 * Strategy (conservative — false positives are worse than misses):
 *   1. Skip press docs that already have relatedRelease
 *   2. For each press piece, build a search blob: headline + quote + url + outlet
 *   3. For each release, see if its title OR slug OR catalog number appears
 *      verbatim in the blob (word-boundary match, case-insensitive)
 *   4. If exactly ONE release matches → link it
 *   5. If multiple match → skip (ambiguous), log for manual review
 *
 * Run: npx tsx scripts/autolink-press-to-releases.ts
 *   Add `--dry` to just report matches without writing.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const DRY = process.argv.includes("--dry");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Release = {
  _id: string;
  title: string;
  slug: string;
  catalogNumber?: string;
};

type Press = {
  _id: string;
  headline?: string;
  quote?: string;
  url?: string;
  outlet?: string;
};

// Lowercase + collapse to word-only chars for needle matching. Punctuation
// in either side (release title or press text) shouldn't break a match.
function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]+/g, " ").replace(/\s+/g, " ").trim();
}

/** True if `needle` appears in `haystack` as a whole word/phrase. */
function contains(haystack: string, needle: string): boolean {
  const h = norm(haystack);
  const n = norm(needle);
  if (n.length < 4) return false; // 3-char needles too noisy ("ep", "lp", "iv")
  // Word-boundary match.
  const re = new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
  return re.test(h);
}

async function main() {
  const [releases, press] = await Promise.all([
    client.fetch<Release[]>(
      `*[_type == "release" && withdrawn != true]{ _id, title, "slug": slug.current, catalogNumber }`,
    ),
    client.fetch<Press[]>(
      `*[_type == "pressQuote" && !defined(relatedRelease)]{ _id, headline, quote, url, outlet }`,
    ),
  ]);

  console.log(`Press without relatedRelease: ${press.length}`);
  console.log(`Active releases: ${releases.length}`);

  const matches: Array<{ pressId: string; releaseId: string; needle: string; via: string }> = [];
  const ambiguous: Array<{ pressId: string; candidates: { releaseId: string; needle: string; via: string }[] }> = [];

  for (const p of press) {
    const blob = [p.headline, p.quote, p.url, p.outlet].filter(Boolean).join(" || ");
    if (!blob) continue;
    const hits: { releaseId: string; needle: string; via: string }[] = [];
    for (const r of releases) {
      // Try title first (most specific), then catalog number.
      if (r.title.length >= 4 && contains(blob, r.title)) {
        hits.push({ releaseId: r._id, needle: r.title, via: "title" });
      } else if (r.catalogNumber && r.catalogNumber.length >= 4 && contains(blob, r.catalogNumber)) {
        hits.push({ releaseId: r._id, needle: r.catalogNumber, via: "catalogNumber" });
      }
    }
    if (hits.length === 1) {
      matches.push({ pressId: p._id, ...hits[0] });
    } else if (hits.length > 1) {
      ambiguous.push({ pressId: p._id, candidates: hits });
    }
  }

  console.log(`\n→ ${matches.length} unique-match auto-links`);
  console.log(`→ ${ambiguous.length} ambiguous (need manual review)`);

  if (DRY) {
    console.log("\n--- MATCHES ---");
    for (const m of matches.slice(0, 30)) {
      console.log(`  ${m.pressId} → ${m.releaseId} (via ${m.via}: "${m.needle}")`);
    }
    if (matches.length > 30) console.log(`  …and ${matches.length - 30} more`);
    console.log("\n--- AMBIGUOUS ---");
    for (const a of ambiguous.slice(0, 10)) {
      console.log(`  ${a.pressId} → ${a.candidates.length} candidates: ${a.candidates.map((c) => c.releaseId).join(", ")}`);
    }
    return;
  }

  let applied = 0;
  for (const m of matches) {
    await client
      .patch(m.pressId)
      .set({ relatedRelease: { _type: "reference", _ref: m.releaseId } })
      .commit();
    applied++;
    if (applied % 10 === 0) process.stdout.write(`\r  applied ${applied}/${matches.length}`);
  }
  process.stdout.write(`\r  applied ${applied}/${matches.length}\n`);

  if (ambiguous.length > 0) {
    console.log(`\n${ambiguous.length} ambiguous — first 20:`);
    for (const a of ambiguous.slice(0, 20)) {
      console.log(`  ${a.pressId} → ${a.candidates.map((c) => `${c.releaseId.replace(/^release-/, "")}[${c.via}]`).join(" / ")}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
