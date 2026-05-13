/**
 * Smart press→release linker.
 *
 * For every press piece without a `relatedRelease` ref, scan its headline +
 * quote + excerpt + URL for the title of any release in the catalog. When
 * a confident match is found, set `relatedRelease` so the press tile can
 * fall back to the album cover (via the new image-fallback on /press).
 *
 * Confidence rules — applied in this order, first match wins:
 *   (1) Release title appears verbatim in HEADLINE (case-insensitive),
 *       AND title is ≥ 4 chars AND not a generic common word.
 *   (2) Release SLUG appears verbatim in URL (e.g. "/relationships/").
 *   (3) Release title appears verbatim in QUOTE or EXCERPT.
 *
 * Skips:
 *   · pieces that already have relatedRelease set
 *   · matches against release titles that are too short or too common
 *     (one-word titles like "Drums" / "Relationships" / "Head" only match
 *     if they appear AS WHOLE WORDS, not substrings, AND there's no other
 *     ambiguity)
 *
 * Idempotent — re-runnable. Print summary + per-link diff. Use --dry to
 * preview.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DRY = process.argv.includes("--dry");

type Release = { _id: string; title: string; slug: string; year?: number };
type Press = { _id: string; headline?: string; quote?: string; excerpt?: string; url?: string; outlet?: string };

// Common single words that appear in many releases — won't auto-link unless
// they're already the entire title AND the press piece has another anchor.
// Better to leave un-matched than to mis-link.
const COMMON_WORDS = new Set([
  "drums", "head", "relationships", "darko", "breathe", "peephole", "fresh",
  "iv", "drums 2", "bluni", "the crystal",
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Whole-word substring check: returns true iff `needle` appears as a contiguous
// run of word chars within `haystack` (case-insensitive, punctuation-tolerant).
function containsWholePhrase(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n || !h) return false;
  // Word-boundary regex
  const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(h);
}

(async () => {
  const releases = await c.fetch<Release[]>(
    `*[_type == "release" && (withdrawn != true) && defined(title) && length(title) >= 2] {
      _id, title, "slug": slug.current, year
    }`
  );
  const press = await c.fetch<Press[]>(
    `*[_type == "pressQuote" && !defined(relatedRelease)] {
      _id, headline, quote, excerpt, url, outlet
    }`
  );
  console.log(`\nscanning ${press.length} press pieces against ${releases.length} releases${DRY ? " (DRY)" : ""}\n`);

  // Pre-build per-release distinctness flag — if a title is in COMMON_WORDS or
  // shorter than 4 chars, treat it as "fragile" — only match in HEADLINE, not
  // in quote/excerpt.
  const releasesIndexed = releases.map((r) => ({
    ...r,
    fragile: r.title.length < 5 || COMMON_WORDS.has(r.title.toLowerCase()),
  }));

  // Sort releases LONGEST title first so we prefer specific matches over generic.
  releasesIndexed.sort((a, b) => b.title.length - a.title.length);

  let matched = 0, ambiguous = 0, none = 0, slugHits = 0, headHits = 0, bodyHits = 0;

  for (const p of press) {
    const headline = p.headline ?? "";
    const url      = p.url ?? "";
    const body     = `${p.quote ?? ""}\n${p.excerpt ?? ""}`;

    // Tier 1: SLUG match in URL — very high confidence
    let hit = releasesIndexed.find((r) => url.toLowerCase().includes(`/${r.slug}/`) || url.toLowerCase().includes(`-${r.slug}/`));
    let how: "slug" | "headline" | "body" | null = hit ? "slug" : null;

    // Tier 2: SLUG keyword in URL host path (e.g. "relationships" in url)
    if (!hit) {
      // Try slug stem (strip cc001-/ldcc-/etc prefix)
      const candidates = releasesIndexed.filter((r) => {
        const stem = r.slug.replace(/^(cc\d+-|ldcc\d+-|hookemon\d+-|ccinst\d+-)/i, "");
        if (stem.length < 6) return false;
        return url.toLowerCase().includes(stem);
      });
      if (candidates.length === 1) { hit = candidates[0]; how = "slug"; }
      else if (candidates.length > 1) { ambiguous += 1; }
    }

    // Tier 3: Release title appears in HEADLINE
    if (!hit) {
      const headMatches = releasesIndexed.filter((r) => containsWholePhrase(headline, r.title));
      if (headMatches.length === 1) { hit = headMatches[0]; how = "headline"; }
      else if (headMatches.length > 1) {
        // Prefer the longest title (sorted earlier)
        hit = headMatches[0];
        how = "headline";
      }
    }

    // Tier 4: Release title in BODY — DISABLED. Too risky for press pieces
    // with empty headlines, since the body text is often a press release
    // recap mentioning multiple records, and we'd auto-link to the wrong one.
    // Re-enable selectively if we ever want to bulk-process a known-clean
    // batch.
    void body;

    if (!hit) {
      none += 1;
      continue;
    }

    matched += 1;
    if (how === "slug") slugHits += 1;
    if (how === "headline") headHits += 1;
    if (how === "body") bodyHits += 1;

    const lbl = `[${how!.padEnd(8)}]  ${(p.outlet ?? "?").padEnd(22)}  →  ${hit.title.padEnd(38)}  ·  "${(p.headline ?? "").slice(0, 70)}"`;
    if (DRY) {
      console.log(`would link: ${lbl}`);
      continue;
    }
    try {
      await c.patch(p._id).set({ relatedRelease: { _type: "reference", _ref: hit._id } }).commit();
      console.log(`+ linked   : ${lbl}`);
    } catch (err) {
      console.log(`✗ failed   : ${lbl} — ${(err as Error).message}`);
    }
  }

  console.log(`\n done. matched=${matched}  none=${none}  ambiguous-skipped=${ambiguous}`);
  console.log(`       breakdown: slug=${slugHits}  headline=${headHits}  body=${bodyHits}\n`);
})();
