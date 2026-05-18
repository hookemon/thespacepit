/**
 * Vinyl-jacket credit ordering — canonical convention across thespacepit.
 *
 * Per Nick's 2026-05-17 update, the order is:
 *
 *   Produced by → Additional Production by → Written by → Performed by
 *   → Vocals → Guitar / Bass / Strings / Horns / Turntables
 *   → Mixed → Mastered → Engineering → "Recorded at <studio>" footer
 *
 * Filtered out entirely (don't render on the page):
 *   - Programming / Sequencing / Drum machine / Sample / Beat
 *   - Keys / Piano / Rhodes / Wurlitzer / Moog / Organ / Synth
 *   - "Recorded by" (engineer label too generic — fact-check per release)
 *
 * Used by:
 *   - app/releases/[slug]/page.tsx (album-wide credits room)
 *   - app/releases/[slug]/TracklistAndCover.tsx (per-track credits popout)
 *
 * Matching is intentionally permissive (substring, case-insensitive) so
 * legacy data still sorts correctly even when role strings drift.
 */

/** Lower = sorts earlier. Gaps left for in-bucket nuance. */
export function rankRole(role: string): number {
  const r = (role ?? "").toLowerCase().trim();
  if (!r) return 999;

  // 1. PRODUCED BY — anchors the top of the credits block.
  //    Exclude "Co-produced" and "Additional production" — they're in
  //    bucket 2 below.
  if (/\b(co-?produc|additional\s*production)/.test(r)) {
    // fall through to bucket 2
  } else if (/^produc(ed by|er|tion)\b/.test(r) || /\bproduced by\b/.test(r)) {
    return 10;
  }

  // 2. ADDITIONAL PRODUCTION / CO-PROD / REMIX
  if (/additional\s*production/.test(r)) return 20;
  if (/co-?produc/.test(r)) return 21;
  if (/remix|re-?edit|edit by/.test(r)) return 22;

  // 3. WRITTEN BY (then "Additional writer" right under it)
  if (/additional\s*(writer|writing)/.test(r)) return 31;
  if (/^written by$|songwriter|^lyrics by$|\bwriter\b/.test(r)) return 30;

  // 4. PERFORMED BY — collective performer line.
  if (/^performed by\b|\bperformer\b/.test(r)) return 40;

  // 5. VOCALS — lead first, then additional, then features/guests, then backing.
  if (/lead vocal/.test(r)) return 50;
  if (/^vocals?$|^vox\b/.test(r)) return 51;
  if (/additional\s*vocal/.test(r)) return 52;
  if (/featur|^ft\.?\b|guest/.test(r)) return 53;
  if (/^rap\b|\brap by\b|\bverse\b/.test(r)) return 54;
  if (/back(ing|ground)?\s*vocal/.test(r)) return 55;
  if (/(harmon|ad-?lib|hook|chorus)/.test(r)) return 56;

  // 6. INSTRUMENTALISTS — stage-billing order. Programming + keys are
  //    intentionally absent (filtered via isFilteredRole below).
  if (/drum|percuss|kit\b/.test(r)) return 60;
  if (/bass\b/.test(r)) return 61;
  if (/guitar/.test(r)) return 62;
  if (/(string|violin|viola|cello|orchestr)/.test(r)) return 63;
  if (/(horn|brass|trumpet|trombone|saxophone|sax\b|flute|woodwind)/.test(r)) return 64;
  if (/(turntabl|scratch|dj cut)/.test(r)) return 65;

  // 7. ENGINEERING — comes before Mixed in chronological record-making
  //    order: recorded → mixed → mastered. "Recorded by" is FILTERED OUT
  //    via isFilteredRole; "Engineering by" / "Engineered by" stay.
  if (/^engineer|engineered by/.test(r)) return 70;

  // 8. MIX — lead engineer first, then co-mix, then assistant.
  if (/(mix|mastering).*assist|assist.*(mix|engineer)/.test(r)) return 82;
  if (/^co-?mix/.test(r)) return 81;
  if (/^mix|mix(ed|ing)\s+by\b/.test(r)) return 80;

  // 9. MASTER
  if (/^master|master(ed|ing)\s+by\b/.test(r)) return 90;

  // 10. STUDIO / LOCATION (separate footer block on the album view).
  if (/recorded at|recording studio|cut at|studio$/.test(r)) return 100;

  // 11. Other / catch-all (artwork, A&R, publishing, etc.).
  if (/(artwork|cover|design|photo|illustration|layout|sleeve)/.test(r)) return 110;
  if (/(a&r|management|exec|publishing|label)/.test(r)) return 120;

  return 999;
}

/**
 * Roles that should NOT render on the public release page. Per Nick:
 * programming and keys credits are too granular for the vinyl-jacket
 * read, and "Recorded by" engineer credit needs per-release fact-checking
 * before it ships publicly.
 */
export function isFilteredRole(role: string): boolean {
  const r = (role ?? "").toLowerCase().trim();
  if (!r) return false;
  // Programming / sequencing / drum machine / sample / beat
  if (/(program|sequenc|drum\s*machine|^sampl|^beats?\b)/.test(r)) return true;
  // Keys family — piano, Rhodes, Wurli, Moog, organ, synth
  if (/(^keys?\b|piano|rhodes|wurlitzer|wurli\b|moog|^organ\b|synth)/.test(r)) return true;
  // "Recorded by" engineer label (the studio LOCATION "Recorded at" still
  // renders — different rank, handled by isLocationRole).
  if (/^record(ed)?\s+by\b/.test(r)) return true;
  return false;
}

/**
 * Sort a list of credits (or anything with a `role` field) into vinyl-jacket
 * reading order. Filters out roles flagged by `isFilteredRole`. Stable for
 * ties — entries with the same rank stay in input order.
 */
export function sortByRoleOrder<T extends { role?: string }>(credits: T[]): T[] {
  return credits
    .filter((c) => !isFilteredRole(c.role ?? ""))
    .map((c, i) => ({ c, i, k: rankRole(c.role ?? "") }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.c);
}

/**
 * Split a list of roles into the "people" group (lines 1–9) vs the
 * "location" group (line 10, the studio footer). Used by the album-wide
 * credits room to render them in two distinct typographic blocks.
 */
export function isLocationRole(role: string): boolean {
  return rankRole(role) === 100;
}
