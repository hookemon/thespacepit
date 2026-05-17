/**
 * Vinyl-jacket credit ordering — canonical convention across thespacepit.
 *
 *   Vocals → Produced by → Co-prod/Remix → Instrumentalists → Mixed → Mastered
 *   then "Recorded at <studio>" below in a separate location block.
 *
 * Per Nick's memory note `feedback_credit_ordering.md` — one line per role,
 * read like a 12" jacket, not a database table. Used by:
 *   - app/releases/[slug]/page.tsx (album-wide credits room)
 *   - app/releases/[slug]/TracklistAndCover.tsx (per-track credits popout)
 *
 * The matching is intentionally permissive (substring, case-insensitive)
 * so legacy data still sorts correctly even when role strings drift
 * ("Producer" vs "Produced by", "Bass guitar" vs "Bass", etc.).
 */

/** Lower = sorts earlier. Gaps left for in-bucket nuance. */
export function rankRole(role: string): number {
  const r = (role ?? "").toLowerCase().trim();
  if (!r) return 999;

  // 0. WRITTEN BY — anchors the top of the jacket on real records
  //    ("All songs written by X. Produced by Y. …"). Public credit only —
  //    actual splits live in writerCredits[] (PRIVATE) on each track.
  if (/^written by$|songwriter|^lyrics by$/.test(r)) return 5;

  // 1. VOCALS — lead first, then features/guests, then backing.
  if (/lead vocal/.test(r)) return 10;
  if (/^vocals?$/.test(r) || /^vox\b/.test(r)) return 11;
  if (/featur|^ft\.?\b|guest/.test(r)) return 12;
  if (/^rap\b/.test(r) || /\brap by\b/.test(r) || /\bverse\b/.test(r)) return 13;
  if (/back(ing|ground)?\s*vocal/.test(r)) return 14;
  if (/(harmon|ad-?lib|hook|chorus)/.test(r)) return 15;

  // 2. PRODUCED BY — anything that reads as "this person produced it".
  //    Match "Producer", "Produced by", "Production", but EXCLUDE
  //    "Co-produced", "Additional production" (those are bucket 3).
  if (/\b(co-?produc|additional\s*production)/.test(r)) {
    // fall through to bucket 3 below
  } else if (/^produc(ed by|er|tion)\b/.test(r) || /\bproduced by\b/.test(r)) {
    return 20;
  }

  // 3. CO-PROD / ADDITIONAL PROD / REMIX
  if (/co-?produc/.test(r)) return 30;
  if (/additional\s*production/.test(r)) return 31;
  if (/remix|re-?edit|edit by/.test(r)) return 32;

  // 4. INSTRUMENTALISTS — order by stage-billing tradition
  //    (drums + bass = rhythm section first, then guitars, then keys, then
  //    strings/horns, then programming/samples last).
  if (/drum|percuss|kit\b/.test(r)) return 40;
  if (/bass\b/.test(r)) return 41;
  if (/guitar/.test(r)) return 42;
  if (/(keys|piano|rhodes|wurlitzer|moog|organ|synth)/.test(r)) return 43;
  if (/(string|violin|viola|cello|orchestr)/.test(r)) return 44;
  if (/(horn|brass|trumpet|trombone|saxophone|sax\b|flute|woodwind)/.test(r)) return 45;
  if (/(sample|program|sequenc|drum machine|beat\b)/.test(r)) return 46;
  if (/(turntabl|scratch|dj cut)/.test(r)) return 47;

  // 5. MIX — lead engineer first, then co-mix, then assistant
  if (/(mix|mastering).*assist|assist.*(mix|engineer)/.test(r)) return 52;
  if (/^co-?mix/.test(r)) return 51;
  if (/^mix|mix(ed|ing)\s+by\b/.test(r)) return 50;

  // 6. MASTER
  if (/^master|master(ed|ing)\s+by\b/.test(r)) return 60;

  // 7. RECORDING / ENGINEERING (separate from "Recorded at" studio block)
  if (/(record|track)(ed|ing)\s+(by|engineer)|^engineer|engineered by/.test(r)) return 70;

  // 8. STUDIO / LOCATION (renders in its own footer block on the album view)
  if (/recorded at|recording studio|cut at|studio$/.test(r)) return 80;

  // 9. Other / catch-all (artwork, photography, mgmt, etc.) — written-by
  //    has already been hoisted to rank 5 above.
  if (/(artwork|cover|design|photo|illustration|layout|sleeve)/.test(r)) return 91;
  if (/(a&r|management|exec|publishing|label)/.test(r)) return 92;

  return 99;
}

/**
 * Sort a list of credits (or anything with a `role` field) into vinyl-jacket
 * reading order. Stable for ties — entries with the same rank stay in
 * input order.
 */
export function sortByRoleOrder<T extends { role?: string }>(credits: T[]): T[] {
  return credits
    .map((c, i) => ({ c, i, k: rankRole(c.role ?? "") }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.c);
}

/**
 * Split a list of roles into the "people" group (lines 1–7) vs the
 * "location" group (line 8, the studio footer). Used by the album-wide
 * credits room to render them in two distinct typographic blocks.
 */
export function isLocationRole(role: string): boolean {
  return rankRole(role) === 80;
}
