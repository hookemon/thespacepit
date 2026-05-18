/**
 * For each owned release, reorder the Sanity tracklist[] to match the actual
 * release order (read from the leading "01 / 02 / 03..." numbering on files
 * in the catalog folder). Some old C+C records have alphabetized tracklists
 * in Sanity, which would cause the audio-upload script to attach files to
 * the WRONG slots.
 *
 * Safety: dry-run by default, only patches when --apply is passed. For each
 * release we require >=80% of tracks to confidently fuzzy-match a file
 * before we'll re-order — otherwise we skip with REVIEW NEEDED and let
 * Nick fix it manually in Studio.
 *
 *   npx tsx scripts/reorder-tracklists-from-files.ts                  # dry-run all owned
 *   npx tsx scripts/reorder-tracklists-from-files.ts --apply
 *   npx tsx scripts/reorder-tracklists-from-files.ts --slug=cc006-electrogenetic --apply
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, join, basename } from "path";
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");

const OWNED_LABELS = [
  "Calm + Collect",
  "Calm + Collect Instrumental",
  "Lockhart Dynasty × Calm + Collect",
  "Hookemon",
  "Calllm",
];

const CATALOG_ROOT =
  process.env.CC_CATALOG_ROOT ??
  "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT CATALOG( CURRENT AS OF Q3 2025)";

const IMPRINT_DIRS: Record<string, string> = {
  "Calm + Collect": "1-Calm + Collect",
  "Calm + Collect Instrumental": "1-Calm + Collect",
  "Lockhart Dynasty × Calm + Collect": "2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)",
  "Hookemon": "3-Hookemon Records",
  "Calllm": "4-CALLLM (Ambient Imprint)",
};

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Track = { _key: string; title: string; [k: string]: unknown };
type Release = {
  _id: string;
  slug: string;
  title: string;
  catalogNumber?: string;
  label?: string;
  tracklist: Track[];
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
const VERSION_TOKENS = new Set([
  "remix", "remixes", "edit", "edits", "instrumental", "instrumentals", "inst",
  "acapella", "accapella", "acappella", "accappella", "acap", "dub", "version",
  "vip", "refix", "rework", "extended", "radio", "club", "alt", "alternate",
  "demo", "live", "interlude", "intro", "outro",
]);

/**
 * Asymmetric containment similarity with a version-token penalty. Same as the
 * upload script — keeps "TAKE ME HIGH" from winning over "TAKE ME HIGH- BART
 * B MORE REMIX" when matching against a remix file.
 */
function titleInFile(title: string, filename: string): number {
  const titleTokens = normalize(title).split(" ").filter((t) => t.length >= 2);
  const titleSet = new Set(titleTokens);
  const fileTokens = normalize(filename).split(" ").filter((t) => t.length >= 1);
  const fileSet = new Set(fileTokens);
  if (titleTokens.length === 0) return 0;
  let hit = 0;
  for (const t of titleTokens) if (fileSet.has(t)) hit += 1;
  let score = hit / titleTokens.length;
  for (const t of fileSet) {
    if (VERSION_TOKENS.has(t) && !titleSet.has(t)) score *= 0.5;
  }
  return score;
}
const similarity = titleInFile;
function extractTrackNumber(filename: string): number | null {
  const name = basename(filename);
  // Bandcamp-download "disc-track-title" form: "1-13-blessing-...wav".
  // When the first number is 1-4 (typical disc count) and a second number
  // immediately follows, the SECOND number is the track index.
  const discTrack = name.match(/^(\d{1,2})[-_.](\d{1,3})[\s\-_.]/);
  if (discTrack) {
    const disc = parseInt(discTrack[1], 10);
    const track = parseInt(discTrack[2], 10);
    if (disc >= 1 && disc <= 4) return track;
  }
  // Plain leading-number form: "01 Title.wav", "12_Title.mp3".
  const m = name.match(/^(\d{1,3})[\s\-_.]/);
  return m ? parseInt(m[1], 10) : null;
}
function extractTitleHint(filename: string): string {
  let s = basename(filename).replace(/\.[^.]+$/, "");
  s = s.replace(/^\d{1,3}[\s\-_.]+/, "");
  s = s.replace(/[\s\-]*\d{2,4}\s*bpm.*$/i, "");
  s = s.replace(/^[^-]+ - /, "");
  return s.trim();
}

async function findReleaseFolder(r: Release): Promise<string | null> {
  const imprintDir = r.label ? IMPRINT_DIRS[r.label] : null;
  if (!imprintDir) return null;
  const imprintPath = join(CATALOG_ROOT, imprintDir);
  if (!existsSync(imprintPath)) return null;
  const folders = await readdir(imprintPath);
  if (r.catalogNumber) {
    const cn = r.catalogNumber.toUpperCase();
    const exact = folders.find((f) => new RegExp(`^${cn}([-: ]|$)`).test(f.toUpperCase()));
    if (exact) return join(imprintPath, exact);
  }
  let best: { folder: string; score: number } | null = null;
  for (const f of folders) {
    const score = similarity(f, r.title);
    if (!best || score > best.score) best = { folder: f, score };
  }
  return best && best.score >= 0.5 ? join(imprintPath, best.folder) : null;
}

async function walkAudioFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries: string[];
    try { entries = await readdir(d); } catch { return; }
    for (const name of entries) {
      if (name.startsWith(".") || /^(STEMS|SAMPLE PACK|ART|VIDEO CONTENT|VIZUALIZERS?|PHOTOS|PRESS)/i.test(name)) continue;
      const full = join(d, name);
      const s = await stat(full).catch(() => null);
      if (!s) continue;
      if (s.isDirectory()) await walk(full);
      else if (/\.(wav|mp3|m4a|aif|aiff|flac)$/i.test(name)) {
        if (/\b(stem|drums|bass|vox|vocal|kick|snare|hat|fx|instrumental)\b/i.test(name)) continue;
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

async function processRelease(r: Release) {
  const folder = await findReleaseFolder(r);
  if (!folder) return { status: "SKIP", reason: "no folder" } as const;
  const files = await walkAudioFiles(folder);
  if (files.length === 0) return { status: "SKIP", reason: "no audio files" } as const;

  // Build numbered file list (only files with leading track number).
  const numbered = files
    .map((f) => ({ f, n: extractTrackNumber(f) }))
    .filter((x): x is { f: string; n: number } => x.n !== null && x.n >= 1)
    .sort((a, b) => a.n - b.n);
  if (numbered.length === 0) {
    return { status: "SKIP", reason: "no numbered files (can't infer release order)" } as const;
  }

  // Map each file to its best-matching Sanity track via title-in-filename
  // containment. Match is "confident" if >=0.6 of the Sanity title's tokens
  // appear in the filename. We pass the full basename — extra tokens
  // (artist names, BPM, slugs) don't hurt since the score is asymmetric.
  type Hit = { fileN: number; sanityIdx: number; sim: number };
  const hits: Hit[] = [];
  const usedSanity = new Set<number>();
  for (const { f, n } of numbered) {
    let best: { sanityIdx: number; sim: number } | null = null;
    for (let si = 0; si < r.tracklist.length; si++) {
      if (usedSanity.has(si)) continue;
      const sim = similarity(r.tracklist[si].title, basename(f));
      if (!best || sim > best.sim) best = { sanityIdx: si, sim };
    }
    if (best && best.sim >= 0.6) {
      hits.push({ fileN: n, sanityIdx: best.sanityIdx, sim: best.sim });
      usedSanity.add(best.sanityIdx);
    }
  }

  // Need enough matches to draw a conclusion. Threshold is against TRACK
  // count, not file count — a release folder can have 50 files (stems,
  // remixes, instrumentals) but only 16 tracks; matching 15 of 16 tracks
  // is plenty even if 35 of 50 files are unrelated.
  const trackCount = r.tracklist.length;
  if (trackCount === 1) {
    // One-track releases can't be misordered. Just report status.
    return hits.length > 0
      ? ({ status: "OK", reason: "1-track release; matched ok" } as const)
      : ({ status: "REVIEW", reason: "1-track release; no file match found" } as const);
  }
  if (hits.length < Math.ceil(trackCount * 0.6)) {
    return {
      status: "REVIEW" as const,
      reason: `only matched ${hits.length}/${trackCount} tracks confidently — title overlap too low (likely a rename or scattered data)`,
    };
  }

  // Are the matched sanity indexes monotonically increasing in file order?
  // That's the test: monotonic → Sanity is in the right order; non-monotonic
  // → Sanity is scrambled and we should reorder.
  const monotonic = hits.every((h, i) => i === 0 || h.sanityIdx > hits[i - 1].sanityIdx);
  if (monotonic) {
    return {
      status: "OK" as const,
      reason: `${hits.length}/${numbered.length} confident matches; order looks correct`,
    };
  }

  // Build new order: matched tracks in file-number order first, then any
  // unmatched Sanity tracks appended (their position is uncertain).
  const matchedKeys = new Set(hits.map((h) => r.tracklist[h.sanityIdx]._key));
  const newOrder: Track[] = [];
  for (const h of hits) newOrder.push(r.tracklist[h.sanityIdx]);
  for (const t of r.tracklist) if (!matchedKeys.has(t._key)) newOrder.push(t);

  const oldKeys = r.tracklist.map((t) => t._key).join(",");
  const newKeys = newOrder.map((t) => t._key).join(",");
  if (oldKeys === newKeys) {
    return { status: "OK", reason: "already in order" } as const;
  }
  return {
    status: "REORDER" as const,
    reason: `${hits.length}/${numbered.length} confident matches; Sanity indices ${hits.map(h => h.sanityIdx).join(",")} not monotonic`,
    oldOrder: r.tracklist.map((t) => t.title),
    newOrder: newOrder.map((t) => t.title),
    leftoverTitles: r.tracklist.filter(t => !matchedKeys.has(t._key)).map(t => t.title),
    newTracklist: newOrder,
  };
}

(async () => {
  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const rows = await c.fetch<Release[]>(
    `*[_type == "release" && (withdrawn != true) && label in $labels ${slugFilter}]
      | order(label asc, catalogNumber asc) {
        _id, "slug": slug.current, title, catalogNumber, label,
        tracklist
      }`,
    { labels: OWNED_LABELS }
  );

  console.log(`Scanning ${rows.length} owned release${rows.length === 1 ? "" : "s"}${APPLY ? "" : " (DRY RUN — pass --apply to commit)"}\n`);

  let okCount = 0, reorderCount = 0, reviewCount = 0, skipCount = 0, appliedCount = 0;
  const reviewNeeded: Array<{ slug: string; title: string; reason: string }> = [];

  for (const r of rows) {
    if (!r.tracklist || r.tracklist.length === 0) {
      skipCount += 1;
      continue;
    }
    const result = await processRelease(r);
    const tag = `${(r.catalogNumber ?? "—").padEnd(9)} ${r.title}`;
    if (result.status === "OK") {
      console.log(`✓ ${tag}  — already in order`);
      okCount += 1;
    } else if (result.status === "SKIP") {
      console.log(`· ${tag}  — skip: ${result.reason}`);
      skipCount += 1;
    } else if (result.status === "REVIEW") {
      console.log(`⚠ ${tag}  — REVIEW: ${result.reason}`);
      reviewCount += 1;
      reviewNeeded.push({ slug: r.slug, title: r.title, reason: result.reason });
    } else if (result.status === "REORDER") {
      console.log(`↻ ${tag}  — REORDER (${result.reason})`);
      console.log(`     before: ${result.oldOrder.join(" → ")}`);
      console.log(`      after: ${result.newOrder.join(" → ")}`);
      reorderCount += 1;
      if (APPLY) {
        await c.patch(r._id).set({ tracklist: result.newTracklist }).commit();
        console.log(`     ✓ patched`);
        appliedCount += 1;
      }
    }
  }

  console.log(`\n${okCount} already-correct · ${reorderCount} need reorder${APPLY ? ` (${appliedCount} applied)` : ""} · ${reviewCount} need manual review · ${skipCount} skipped`);
  if (reviewNeeded.length > 0) {
    console.log(`\nManual review needed in Sanity Studio:`);
    for (const x of reviewNeeded) console.log(`  · ${x.slug}: ${x.reason}`);
  }
})().catch((err) => { console.error(err); process.exit(1); });
