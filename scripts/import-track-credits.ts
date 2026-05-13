/**
 * Per-track credit importer — pulls from `scripts/data/credits/*.tsv`
 * (extracted from Nick's Drive) and writes ISRC + features + remixer +
 * length + writers into each release's `tracklist[]` in Sanity.
 *
 * Sources (all already extracted to disk by the drive scan):
 *   · 10-nick-hook-metadata-1.tsv  — Fool's Gold delivery for Relationships LP, Head single, Can't Tell Me Nothing EP
 *   · 11-nick-hook-metadata-2.tsv  — same + 50 Backwoods
 *   · 12-cz-catalog.tsv            — Nick's master CZ spreadsheet (early EPs: Fuck Work, Josephine, Black & Blue, Hoes Come Out at Night)
 *   · 13-cz-fg-metadata.tsv        — Fool's Gold delivery for CZ Follow Your Heart, Take Me High, Darko
 *
 * Match strategy:
 *   · UPC → release slug (via UPC_TO_SLUG map below — built from
 *     querying Sanity once)
 *   · For each row: find existing track in that release's tracklist by
 *     normalized title (lowercase, strip punctuation, strip "feat./ft.",
 *     strip "(remix)" / "(instrumental)" / "(acapella)" — match on the
 *     core song name). If matched, patch in ISRC + features + remixer +
 *     length + writers, preserving audioPreviewUrl / videoUrl / note.
 *   · Tracks not found in existing tracklist are LOGGED (not auto-added)
 *     so we don't pollute the public tracklist with instrumental /
 *     acapella versions.
 *
 * Idempotent — re-runs patch in place. Run with --dry to preview.
 *
 * Run: `npx tsx scripts/import-track-credits.ts`
 * Dry: `npx tsx scripts/import-track-credits.ts --dry`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
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

// ── Album/UPC → Sanity release slug ─────────────────────────────
// UPCs come from the FG delivery TSVs. Album names come from the CZ
// catalog spreadsheet (which doesn't have a UPC column for the early
// EPs). Either key resolves to the same release doc.
const UPC_TO_SLUG: Record<string, string> = {
  "852878007014": "cc015-relationships",
  "858157006303": "cc014-head",
  "852878007656": "cc016-cant-tell-me-nothing-remixes",
  "850382008268": "cc017-50-backwoods",
  "856730003008": "ldcc004-follow-your-heart",
  "856730003091": "ldcc005-take-me-high",
  "856730003381": "ldcc006-darko",
};
const ALBUM_TO_SLUG: Record<string, string> = {
  // CZ early EPs (only in 12-cz-catalog.tsv, no UPC column)
  "FUCK WORK": "fuck-work",
  "JOSEPHINE": "ldcc001-josephine",
  "BLACK & BLUE": "ldcc002-black-blue",
  "HOES COME OUT AT NIGHT": "ldcc003-hoes-come-out-at-night",
  // also covered by 13-cz-fg-metadata.tsv with UPCs:
  "FOLLOW YOUR HEART": "ldcc004-follow-your-heart",
  "TAKE ME HIGH": "ldcc005-take-me-high",
  "DARKO": "ldcc006-darko",
};

// ── Track row shape (normalized across the three TSV formats) ───
type TrackRow = {
  releaseSlug: string;
  trackNumber?: number;
  title: string;          // base song title, no version suffix
  version?: string;       // "Instrumental" / "Acapella" / "Salva Remix" / etc.
  isrc?: string;
  features?: string[];    // ["21 Savage", "Bulletproof Dolphin"]
  remixer?: string;       // "DJ Earl", "Tommy Trash" (from version OR explicit Remixer column)
  duration?: string;      // "3:42"
  writers?: string[];     // ["Daud Sturdivant", "Tiombe Lockhart", "Nicholas Conceller"]
  publisher?: string;
};

// ── TSV parser (tab-delimited, header-aware) ───────────────────
function parseTsv(path: string): Record<string, string>[] {
  const txt = readFileSync(path, "utf8");
  const lines = txt.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("====="));
  if (lines.length < 2) return [];
  const header = lines[0].split("\t").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = (cols[i] ?? "").trim(); });
    return obj;
  });
}

// ── Helpers ────────────────────────────────────────────────────
function splitFeatures(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/,(?![^()]*\))/) // split on commas not inside parens
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtDuration(min?: string, sec?: string): string | undefined {
  if (!min && !sec) return undefined;
  const m = parseInt(min ?? "0", 10) || 0;
  const s = parseInt(sec ?? "0", 10) || 0;
  if (m === 0 && s === 0) return undefined;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Normalize legal name → stage name. The BMI / FG delivery TSVs use Nick's
// registered legal name ("Nick Conceller" / "Nicholas Conceller"); the
// public site only ever shows "Nick Hook". Apply this anywhere a writer or
// performer string comes through.
function normalizeLegalNames(name: string): string {
  const n = name.trim();
  if (/^(nicholas\s+conceller|nick\s+conceller)$/i.test(n)) return "Nick Hook";
  return n;
}

// ── Source-specific row → TrackRow normalizers ─────────────────

// Fool's Gold delivery (10-/11-/13-) — same shape, headers differ slightly
function fgRowToTrack(row: Record<string, string>, source: string): TrackRow | null {
  const upc = row["UPC"] || row["Release UPC"] || row["Release Vendor Catalog Number"] || "";
  const slug = UPC_TO_SLUG[upc];
  if (!slug) return null;
  const title = row["Track Name"];
  if (!title) return null;
  const version = row["Track Version"] || undefined;
  const features = splitFeatures(row["Track Artist Track Artist (Featuring)"]);
  const remixer = row["Track Artist Track Artist (Remixer)"] || (version && /remix/i.test(version) ? version.replace(/\s*remix\s*$/i, "").trim() : undefined);
  const isrc = row["Track ISRC"] || undefined;
  const trackNumber = row["Track Track Number"] ? parseInt(row["Track Track Number"], 10) : undefined;
  const duration = fmtDuration(row["Track Length Minute"], row["Track Length Seconds"]);
  const writersRaw = row["Track Writer Track Writer(s)"] || row["Track Writer"];
  // Normalize legal name → stage name. The FG delivery TSVs use Nick's
  // BMI-registered name (Nick / Nicholas Conceller); the public site only
  // ever shows "Nick Hook". Same fix is applied to CZ writer columns below.
  const writers = writersRaw
    ? writersRaw.split(/\s*,\s*/).filter(Boolean).map(normalizeLegalNames)
    : [];
  return {
    releaseSlug: slug,
    trackNumber,
    title,
    version,
    isrc,
    features: features.length > 0 ? features : undefined,
    remixer: remixer || undefined,
    duration,
    writers: writers.length > 0 ? writers : undefined,
    publisher: row["Track Publisher Publisher Name(s)"] || undefined,
  };
}

// Nick's CZ master spreadsheet (12-cz-catalog.tsv)
function czCatalogRowToTrack(row: Record<string, string>): TrackRow | null {
  const album = (row["ALBUM"] || "").toUpperCase();
  const slug = ALBUM_TO_SLUG[album];
  if (!slug) return null;
  const fullTitle = row["TITLE"] || "";
  if (!fullTitle) return null;
  // CZ catalog encodes remixer in the title itself: "JOSEPHINE- (WAAJEED REMIX)"
  // Pull the version out if present.
  let title = fullTitle;
  let version: string | undefined;
  let remixer: string | undefined;
  const remixMatch = fullTitle.match(/^(.*?)[-–—]?\s*\(([^)]+REMIX|[^)]+MIX|[^)]+DUB|INSTRUMENTAL|ACAPELLA|FEAT\.[^)]+)\)\s*$/i);
  if (remixMatch) {
    title = remixMatch[1].trim().replace(/[-–—]\s*$/, "").trim();
    version = remixMatch[2].trim();
    if (/remix|mix|dub/i.test(version) && !/instrumental|acapella/i.test(version)) {
      remixer = version.replace(/\s*(remix|mix|dub)\s*$/i, "").trim();
    }
  }
  return {
    releaseSlug: slug,
    title,
    version,
    isrc: row["IRSC"] || row["ISRC"] || undefined,
    remixer,
    publisher: row["PUBLISHER"] || undefined,
  };
}

// ── Title normalizer (for matching) ────────────────────────────
// Aggressive — strips everything that isn't the core song name so we can
// match Sanity tracklist titles against label-delivery titles regardless
// of how each side formatted it. Cases observed in real data:
//   · ISRC prefix:           "QMSDU1600253 - Need 2 B"     → "need 2 b"
//   · band prefix:           "Cubic Zirconia - Black & Blue f/ Spoek..."  → "black blue"
//   · feature suffix:        "HOOK CHOP FT. WIKI"          → "hook chop"
//   · remix/version suffix:  "DARKO- TOMMY TRASH REMIX"    → "darko"
//   · contraction drift:     "Live While I'm Livin'" vs "...Living"  → both → "live while im livin"
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    // strip leading ISRC code (e.g. "QMSDU1600253 - " — letters+digits then "-")
    .replace(/^[a-z]{2,}\d{6,}\s*[-–—]\s*/i, "")
    // strip band/artist prefix ("Cubic Zirconia - ", "Nick Hook - ", etc.)
    .replace(/^(cubic zirconia|nick hook|spiritual friendship|men women (?:and|&) children|dj earl|run the jewels)\s*[-–—]\s*/i, "")
    // strip parens/brackets entirely
    .replace(/[\(\[].*?[\)\]]/g, " ")
    // strip "ft. X", "feat X", "f/ X", "featuring X" — incl. trailing names
    .replace(/\b(ft|feat|featuring|f\/)\.?\s+.*$/i, "")
    // strip version suffixes after a dash ("- Tommy Trash Remix", "- Instrumental", "- Acappella")
    .replace(/\s*[-–—]\s*(tommy trash remix|tony senghore.*remix|salva remix|arme remix|nadus remix|dj earl remix|thee mike b ?remix|ikonika remix|burt fox remix|bart b more remix|instrumental|acappella|acapella|edit|dub|club mix).*$/i, "")
    // collapse "livin'" / "living" / "livin" — drop trailing g after n
    .replace(/\b(\w+i)ng\b/g, "$1n")
    // strip ALL non-alphanumeric (punctuation, apostrophes, etc.)
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// For remix-only releases (Darko EP, CTMN Remixes, Hoes Come Out at Night)
// the Sanity tracks ARE the variants. The variant key is base title + the
// FULL flavor descriptor (every word of the remix/version label, alpha-only,
// sorted) so two distinct Tony Senghore mixes — "Thrashy 3am Remix" and
// "Deep Remix" — produce different keys instead of colliding on "tonysenghore".
function flavorTokens(...sources: (string | undefined)[]): string {
  const text = sources.filter(Boolean).join(" ").toLowerCase();
  if (!text) return "";
  // Pull every word at least 2 chars, drop "remix"/"mix"/"version" connectives
  // and pure-numeric tokens by themselves (they'd just be noise).
  const tokens = text.match(/[a-z0-9]+/g) ?? [];
  const filtered = tokens.filter((t) => !["mix", "remix", "version", "ver", "edit", "rmx"].includes(t));
  return [...new Set(filtered)].sort().join(",");
}

function normalizeVariantKey(title: string, version?: string, remixer?: string): string {
  const base = normalizeTitle(title);
  return `${base}|${flavorTokens(version, remixer)}`;
}

// Pull variant info OUT of an existing Sanity title so we can build the
// same key for the existing track and match variant→variant.
function existingVariantKey(rawTitle: string): string {
  const base = normalizeTitle(rawTitle);
  // The variant flavor is everything in rawTitle that ISN'T the base song name.
  // Cheap approach: take the part of the lowercased title AFTER the first
  // non-alphanumeric run that isn't part of the base title, OR the contents
  // of any parens, OR everything after the first dash.
  const lc = rawTitle.toLowerCase();
  const parens = [...lc.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).join(" ");
  const afterDash = lc.split(/[-–—]/).slice(1).join(" ");
  const flavor = `${parens} ${afterDash}`;
  return `${base}|${flavorTokens(flavor)}`;
}

// ── Pull all source rows ───────────────────────────────────────
const ROWS: TrackRow[] = [
  ...parseTsv("scripts/data/credits/10-nick-hook-metadata-1.tsv").map((r) => fgRowToTrack(r, "10")),
  ...parseTsv("scripts/data/credits/11-nick-hook-metadata-2.tsv").map((r) => fgRowToTrack(r, "11")),
  ...parseTsv("scripts/data/credits/13-cz-fg-metadata.tsv").map((r) => fgRowToTrack(r, "13")),
  ...parseTsv("scripts/data/credits/12-cz-catalog.tsv").map(czCatalogRowToTrack),
].filter((r): r is TrackRow => r !== null);

// ── Group rows by releaseSlug ──────────────────────────────────
const BY_SLUG = new Map<string, TrackRow[]>();
for (const r of ROWS) {
  const list = BY_SLUG.get(r.releaseSlug) ?? [];
  list.push(r);
  BY_SLUG.set(r.releaseSlug, list);
}

// ── Main ───────────────────────────────────────────────────────
type ExistingTrack = {
  _key?: string;
  title: string;
  duration?: string;
  feature?: string;
  features?: string[];
  remixer?: string;
  isrc?: string;
  writers?: string[];
  note?: string;
  videoUrl?: string;
  audioPreviewUrl?: string;
};

(async () => {
  console.log(`\n💿 Track credit importer — ${BY_SLUG.size} releases · ${ROWS.length} source rows${DRY ? " (DRY)" : ""}\n`);
  let releasesPatched = 0, tracksUpdated = 0, tracksAdded = 0, unmatched: string[] = [];

  for (const [slug, rows] of BY_SLUG) {
    const existing = await c.fetch<{ _id: string; title: string; tracklist?: ExistingTrack[] }>(
      `*[_type == "release" && slug.current == $slug][0]{ _id, title, tracklist }`,
      { slug }
    );
    if (!existing) {
      console.log(`   ✗ ${slug.padEnd(36)} not found in Sanity — skipping ${rows.length} rows`);
      continue;
    }

    const existingTracks: ExistingTrack[] = existing.tracklist ?? [];

    // Build TWO indices:
    //   · byNorm — base song name only (matches main → main)
    //   · byVariant — base + variant info (matches remix → remix on
    //     remix-only releases like Darko EP / CTMN Remixes)
    const byNorm = new Map<string, number>();
    const byVariant = new Map<string, number>();
    existingTracks.forEach((t, i) => {
      const k = normalizeTitle(t.title);
      if (!byNorm.has(k)) byNorm.set(k, i);
      const vk = existingVariantKey(t.title);
      if (!byVariant.has(vk)) byVariant.set(vk, i);
    });

    // Sort source rows: main (no version/remixer) first so they claim the
    // main slot before variants try to.
    const sortedRows = [...rows].sort((a, b) => {
      const aMain = !a.version && !a.remixer ? 0 : 1;
      const bMain = !b.version && !b.remixer ? 0 : 1;
      return aMain - bMain;
    });

    let updates = 0;
    const adds = 0;
    const claimed = new Set<number>();

    // Helper: patch fields onto an existing track, preserving manual data
    // (audioPreviewUrl, videoUrl, note, legacy `feature` string).
    const patchTrack = (idx: number, r: TrackRow) => {
      const e = existingTracks[idx];
      // Also clean the existing title if it has an ISRC prefix or band
      // prefix junked into it — we have the canonical title from delivery
      // metadata now, so use that as the cleaner version.
      const cleanedTitle = (() => {
        const cur = e.title;
        if (/^[a-z]{2,}\d{6,}\s*[-–—]/i.test(cur)) return r.title;     // strip ISRC prefix
        if (/^cubic zirconia\s*[-–—]/i.test(cur)) return r.title;       // strip band prefix
        return cur;
      })();
      existingTracks[idx] = {
        ...e,
        title: cleanedTitle,
        isrc: r.isrc ?? e.isrc,
        features: r.features ?? e.features,
        remixer: r.remixer ?? e.remixer,
        duration: e.duration ?? r.duration,    // keep manual duration if present
        writers: r.writers ?? e.writers,
      };
      claimed.add(idx);
      updates++;
    };

    for (const r of sortedRows) {
      const isVariant = !!(r.remixer || (r.version && /remix|instrumental|acapp?ella|edit|dub/i.test(r.version)));

      if (!isVariant) {
        // Main version → match by base normalized title
        const idx = byNorm.get(normalizeTitle(r.title));
        if (idx !== undefined && !claimed.has(idx)) {
          patchTrack(idx, r);
        } else if (idx !== undefined && claimed.has(idx)) {
          // Duplicate row — same track already claimed by earlier source row.
          // Silently skip (these come from the source TSVs listing the same
          // track multiple times across delivery sheets).
        } else {
          unmatched.push(`${slug} » missing: ${r.title}`);
        }
      } else {
        // Variant version → try variant-key match first (remix-only
        // releases), then fall back to base title.
        const vk = normalizeVariantKey(r.title, r.version, r.remixer);
        const vIdx = byVariant.get(vk);
        if (vIdx !== undefined && !claimed.has(vIdx)) {
          patchTrack(vIdx, r);
          continue;
        }
        if (vIdx !== undefined && claimed.has(vIdx)) continue; // dup
        const idx = byNorm.get(normalizeTitle(r.title));
        if (idx !== undefined && !claimed.has(idx)) {
          patchTrack(idx, r);
        } else if (idx !== undefined && claimed.has(idx)) {
          // Variant whose base title is already claimed by the main version
          // on this release — that's expected, this variant lives on a
          // different release. Silently skip.
        } else {
          unmatched.push(`${slug} » variant: ${r.title}${r.version ? ` (${r.version})` : ""}${r.remixer ? ` [${r.remixer} remix]` : ""}`);
        }
      }
    }

    if (updates === 0) {
      console.log(`   · ${slug.padEnd(36)} no patches (existing tracklist had ${existingTracks.length} rows, none matched)`);
      continue;
    }

    if (DRY) {
      console.log(`   ↻ ${slug.padEnd(36)} would patch ${updates} of ${existingTracks.length} tracks`);
    } else {
      await c.patch(existing._id).set({ tracklist: existingTracks }).commit();
      console.log(`   ↻ ${slug.padEnd(36)} patched ${updates}/${existingTracks.length} tracks`);
    }
    releasesPatched++;
    tracksUpdated += updates;
    tracksAdded += adds;
  }

  console.log(`\n✅ ${releasesPatched} releases patched · ${tracksUpdated} tracks updated${DRY ? " (DRY)" : ""}`);
  if (unmatched.length > 0) {
    console.log(`\n⚠ ${unmatched.length} source rows didn't match an existing track (these are usually remix/instrumental/acapella versions that belong on dedicated remix releases):`);
    unmatched.slice(0, 30).forEach((u) => console.log(`   · ${u}`));
    if (unmatched.length > 30) console.log(`   · ... and ${unmatched.length - 30} more`);
  }
  console.log("");
})();
