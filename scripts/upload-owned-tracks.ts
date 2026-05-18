/**
 * Upload full per-track audio from the C+C catalog Dropbox folder to Sanity.
 *
 * Why this exists: Bandcamp's mp3-128 URLs (the old audioPreviewUrl pattern)
 * use signed tokens that expire — so the play button rots after a few hours.
 * The fix is to host the audio on Sanity ourselves. This script walks the
 * release folder, finds WAVs/MP3s, converts to AAC m4a 256k for web, uploads
 * each as a Sanity file asset, and patches the matching track's `audio` field.
 *
 * Track matching rule:
 *   Filenames are conventionally `01 NICK HOOK ... - <title> ... .wav`. We
 *   match by leading track number (01..NN) AND by title fuzzy-match. Either
 *   signal is sufficient. We warn if both fail.
 *
 * Run:
 *   npx tsx scripts/upload-owned-tracks.ts --slug=cc026-jungle-juice-v-1
 *   npx tsx scripts/upload-owned-tracks.ts --all-owned       # whole C+C catalog
 *   npx tsx scripts/upload-owned-tracks.ts --slug=cc001-... --dry-run
 *   npx tsx scripts/upload-owned-tracks.ts --slug=cc001-... --force  # re-upload even if track.audio is set
 *
 * Owned labels: Calm + Collect, Calm + Collect Instrumental,
 * Lockhart Dynasty × Calm + Collect, Hookemon, Calllm.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, basename, join } from "path";
import { readdir, stat, mkdir, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const ONLY_SLUG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "");
const ALL_OWNED = args.includes("--all-owned");
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

if (!ONLY_SLUG && !ALL_OWNED) {
  console.error("Specify --slug=<slug> or --all-owned");
  process.exit(1);
}

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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type SanityTrack = {
  _key: string;
  title: string;
  duration?: string;
  hasAudio?: boolean;
  audioFilename?: string;
};
type SanityRelease = {
  _id: string;
  title: string;
  slug: string;
  catalogNumber?: string;
  label?: string;
  tracklist: SanityTrack[];
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    // Canonicalize known spelling variants — Sanity titles vs file naming
    // often disagree on doubled letters (acapella/accapella) or hyphens.
    .replace(/\b(accappella|acappella|accapella|acapella|acap)\b/g, "acapella")
    .replace(/\b(thrashy|trashy)\b/g, "trashy")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokens that signal a DIFFERENT VERSION of the same song (remix, edit, etc).
// If the filename has one of these tokens but the title doesn't, we're probably
// looking at a different version — penalize the match so the right remix-track
// wins. Without this, "TAKE ME HIGH" matches every remix filename perfectly
// since "take me high" is contained in all of them.
const VERSION_TOKENS = new Set([
  "remix", "remixes", "edit", "edits", "instrumental", "instrumentals", "inst",
  "acapella", "dub", "version",
  "vip", "refix", "rework", "extended", "radio", "club", "alt", "alternate",
  "demo", "live", "interlude", "intro", "outro",
]);

/**
 * Asymmetric containment similarity with a version-token penalty.
 *   "Shuggie" in "01_SHUGGIE__10.8" → 1.0
 *   "Root" in "1-root-spiritual-friendship---root" → 1.0
 *   "TAKE ME HIGH" in "01 ... Take Me High (Bart B More Remix)" → 0.5 (penalized)
 *   "TAKE ME HIGH BART B MORE REMIX" in same filename → 1.0 (no penalty)
 */
function similarity(a: string, b: string): number {
  const aTokens = normalize(a).split(" ").filter((t) => t.length >= 2);
  const bTokens = normalize(b).split(" ").filter((t) => t.length >= 1);
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  if (aTokens.length === 0 || bSet.size === 0) return 0;
  let hit = 0;
  for (const t of aTokens) if (bSet.has(t)) hit += 1;
  let score = hit / aTokens.length;
  // Penalty: for each version-distinguishing token present in the filename
  // but absent from the title, halve the score. Keeps the "Bart B More
  // Remix" title from competing equally against the base "Take Me High".
  for (const t of bSet) {
    if (VERSION_TOKENS.has(t) && !aSet.has(t)) score *= 0.5;
  }
  return score;
}

async function findReleaseFolder(release: SanityRelease): Promise<string | null> {
  const imprintDir = release.label ? IMPRINT_DIRS[release.label] : null;
  if (!imprintDir) return null;
  const imprintPath = join(CATALOG_ROOT, imprintDir);
  if (!existsSync(imprintPath)) return null;
  const folders = await readdir(imprintPath);
  // 1. Try exact catalog-number prefix match (e.g. "CC026-" or "CC026 ")
  if (release.catalogNumber) {
    const cn = release.catalogNumber.toUpperCase();
    const exact = folders.find((f) =>
      new RegExp(`^${cn}([-: ]|$)`).test(f.toUpperCase())
    );
    if (exact) return join(imprintPath, exact);
  }
  // 2. Fuzzy title match
  let best: { folder: string; score: number } | null = null;
  for (const f of folders) {
    const score = similarity(f, release.title);
    if (!best || score > best.score) best = { folder: f, score };
  }
  if (best && best.score >= 0.5) return join(imprintPath, best.folder);
  return null;
}

async function walkAudioFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries: string[];
    try { entries = await readdir(d); } catch { return; }
    for (const name of entries) {
      if (name.startsWith(".") || name === "STEMS" || name === "STEMS FOR FINAL PROJECT" || name === "SAMPLE PACK") continue;
      const full = join(d, name);
      const s = await stat(full).catch(() => null);
      if (!s) continue;
      if (s.isDirectory()) {
        if (/^(ART|VIDEO CONTENT|VIZUALIZERS?|PHOTOS|PRESS|STEMS|SAMPLE PACK|PROMOS?)/i.test(name)) continue;
        await walk(full);
      } else if (/\.(wav|mp3|m4a|aif|aiff|flac)$/i.test(name)) {
        if (/\b(stem|drums|bass|vox|vocal|kick|snare|hat|fx)\b/i.test(name)) continue;
        out.push(full);
      }
    }
  }
  await walk(dir);
  return dedupeByBasename(out);
}

// Releases often have WAV/, MP3/, and Promos/ subfolders with the same
// track files in each format. Dedupe by normalized basename, keeping the
// highest-quality copy (wav > aif > flac > mp3 > m4a).
function dedupeByBasename(files: string[]): string[] {
  const PRIORITY = ["wav", "aif", "aiff", "flac", "mp3", "m4a"];
  const norm = (f: string) => basename(f).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const k = norm(f);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(f);
  }
  const out: string[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) { out.push(group[0]); continue; }
    group.sort((a, b) => {
      const ea = a.split(".").pop()!.toLowerCase();
      const eb = b.split(".").pop()!.toLowerCase();
      const pa = PRIORITY.indexOf(ea); const pb = PRIORITY.indexOf(eb);
      if (pa !== pb) return pa - pb;
      return a.length - b.length; // shorter path = less nested
    });
    out.push(group[0]);
  }
  return out;
}

function extractTrackNumber(filename: string): number | null {
  const name = basename(filename);
  // Bandcamp-download "disc-track-title" form: "1-13-blessing-...wav".
  const discTrack = name.match(/^(\d{1,2})[-_.](\d{1,3})[\s\-_.]/);
  if (discTrack) {
    const disc = parseInt(discTrack[1], 10);
    const track = parseInt(discTrack[2], 10);
    if (disc >= 1 && disc <= 4) return track;
  }
  const m = name.match(/^(\d{1,3})[\s\-_.]/);
  return m ? parseInt(m[1], 10) : null;
}

function extractTitleHint(filename: string): string {
  // Strip leading "01 ", artist prefixes "NICK HOOK x TASO - ", trailing
  // bpm/key like "160bpm C", and the extension.
  let s = basename(filename).replace(/\.[^.]+$/, "");
  s = s.replace(/^\d{1,3}[\s\-_.]+/, "");
  s = s.replace(/[\s\-]*\d{2,4}\s*bpm.*$/i, "");
  // Strip leading "ARTIST x ARTIST - " or "ARTIST - "
  s = s.replace(/^[^-]+ - /, "");
  return s.trim();
}

async function convertToM4a(srcPath: string): Promise<string> {
  if (/\.m4a$/i.test(srcPath)) return srcPath;
  const dst = join(tmpdir(), `${randomUUID()}.m4a`);
  // afconvert: AAC m4a 256kbps. Sox doesn't ship by default on Mac; afconvert does.
  const ext = srcPath.split(".").pop()!.toLowerCase();
  if (ext === "wav" || ext === "aif" || ext === "aiff" || ext === "flac" || ext === "mp3") {
    const r = spawnSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", "256000", srcPath, dst], { encoding: "utf8" });
    if (r.status !== 0) {
      throw new Error(`afconvert failed for ${srcPath}: ${r.stderr}`);
    }
    return dst;
  }
  throw new Error(`Unsupported audio extension: ${ext}`);
}

async function matchFilesToTracks(audioFiles: string[], tracklist: SanityTrack[]): Promise<{
  matches: Map<string, string>;
  scores: Map<string, number>;
  strategy: "prefix" | "title" | "hybrid";
}> {
  // Score helper. similarity() is asymmetric — first arg should be the
  // clean short string (Sanity title), second the messy long string
  // (full filename, no extraction). Passing the raw basename lets extra
  // tokens in the filename count as "no-op" rather than hurting the score.
  // Also strip any leading "01 " from Sanity titles, since some legacy
  // titles include the track number as a prefix.
  const cleanTitle = (s: string) => s.replace(/^\d{1,3}[\s\-_.]+/, "");
  const titleSim = (f: string, t: SanityTrack) => similarity(cleanTitle(t.title), basename(f));

  // STRATEGY A: prefix-based. Map files to tracks by leading number.
  const prefixMatches = new Map<string, string>();
  const prefixScores = new Map<string, number>();
  for (const f of audioFiles) {
    const n = extractTrackNumber(f);
    if (n === null || n < 1 || n > tracklist.length) continue;
    const t = tracklist[n - 1];
    if (!t || prefixMatches.has(t._key)) continue;
    prefixMatches.set(t._key, f);
    prefixScores.set(t._key, titleSim(f, t));
  }

  // STRATEGY B: title-only. Greedy: assign best-matching file to each track.
  const titleMatches = new Map<string, string>();
  const titleScoresMap = new Map<string, number>();
  const usedB = new Set<string>();
  // Sort tracks by their best available match strength (helps avoid greedy traps).
  const tracksByBest = [...tracklist]
    .map((t) => ({ t, best: Math.max(...audioFiles.map((f) => titleSim(f, t)), 0) }))
    .sort((a, b) => b.best - a.best);
  for (const { t } of tracksByBest) {
    let best: { f: string; s: number } | null = null;
    for (const f of audioFiles) {
      if (usedB.has(f)) continue;
      const s = titleSim(f, t);
      if (!best || s > best.s) best = { f, s };
    }
    if (best && best.s >= 0.45) {
      titleMatches.set(t._key, best.f);
      titleScoresMap.set(t._key, best.s);
      usedB.add(best.f);
    }
  }

  // Score each strategy by mean title-similarity over the tracks it matched.
  const mean = (m: Map<string, number>) =>
    m.size === 0 ? 0 : [...m.values()].reduce((a, b) => a + b, 0) / m.size;
  const prefixMean = mean(prefixScores);
  const titleMean = mean(titleScoresMap);

  // Strategy decision. Prefer PREFIX when reliable, but switch to TITLE
  // when title-based matching is clearly more confident (caught by the
  // version-token-aware similarity).
  let strategy: "prefix" | "title" | "hybrid";
  let chosen: Map<string, string>;
  let chosenScores: Map<string, number>;
  const tracksCount = tracklist.length;
  const prefixCoverage = prefixMatches.size / tracksCount;
  const titleCoverage = titleMatches.size / tracksCount;
  // If title-based has stronger or equal coverage AND a meaningfully higher
  // mean similarity, use it. The "+0.15" margin avoids flipping for tiny
  // numerical wobbles and trusts a clear quality win.
  if (titleCoverage >= prefixCoverage && titleMean > prefixMean + 0.15 && titleMean >= 0.5) {
    strategy = "title";
    chosen = titleMatches;
    chosenScores = titleScoresMap;
  } else if (prefixCoverage >= 0.8 && prefixMean >= 0.4) {
    strategy = "prefix";
    chosen = prefixMatches;
    chosenScores = prefixScores;
  } else if (titleCoverage >= 0.5 && titleMean >= 0.5) {
    strategy = "title";
    chosen = titleMatches;
    chosenScores = titleScoresMap;
  } else if (prefixCoverage >= titleCoverage) {
    strategy = "prefix";
    chosen = prefixMatches;
    chosenScores = prefixScores;
  } else {
    strategy = "title";
    chosen = titleMatches;
    chosenScores = titleScoresMap;
  }

  // Top up missing tracks from the OTHER strategy (only if its score >= 0.45).
  const other = strategy === "prefix" ? titleMatches : prefixMatches;
  const otherScores = strategy === "prefix" ? titleScoresMap : prefixScores;
  const usedFiles = new Set(chosen.values());
  for (const [k, f] of other) {
    if (chosen.has(k)) continue;
    if (usedFiles.has(f)) continue;
    if ((otherScores.get(k) ?? 0) < 0.45) continue;
    chosen.set(k, f);
    chosenScores.set(k, otherScores.get(k) ?? 0);
    usedFiles.add(f);
    if (strategy !== "hybrid") strategy = "hybrid";
  }

  return { matches: chosen, scores: chosenScores, strategy };
}

async function processRelease(release: SanityRelease) {
  console.log(`\n📀 ${release.catalogNumber ?? "—"}  ${release.title}  [${release.label}]`);
  const folder = await findReleaseFolder(release);
  if (!folder) {
    console.log(`   ✗ no matching catalog folder`);
    return { tracks: 0, uploaded: 0, skipped: 0, failed: 0 };
  }
  console.log(`   📁 ${folder.replace(CATALOG_ROOT, "<catalog>")}`);

  const audioFiles = await walkAudioFiles(folder);
  if (audioFiles.length === 0) {
    console.log(`   ✗ no audio files found in folder`);
    return { tracks: release.tracklist.length, uploaded: 0, skipped: 0, failed: 0 };
  }

  const matchResult = await matchFilesToTracks(audioFiles, release.tracklist);
  const matches = matchResult.matches;
  if (matchResult.strategy !== "prefix") {
    console.log(`   ℹ match strategy: ${matchResult.strategy}`);
  }

  let uploaded = 0, skipped = 0, failed = 0;
  for (let i = 0; i < release.tracklist.length; i++) {
    const t = release.tracklist[i];
    const num = String(i + 1).padStart(2, "0");
    const src = matches.get(t._key);
    if (!src) {
      console.log(`   ${num} · ${t.title}  ✗ no file match`);
      failed += 1;
      continue;
    }
    if (t.hasAudio && !FORCE) {
      console.log(`   ${num} · ${t.title}  · already has audio (${t.audioFilename ?? "?"})`);
      skipped += 1;
      continue;
    }
    if (DRY_RUN) {
      console.log(`   ${num} · ${t.title}  → ${basename(src)} (dry-run)`);
      uploaded += 1;
      continue;
    }
    try {
      const m4a = await convertToM4a(src);
      const buf = await readFile(m4a);
      const cleanTitle = t.title.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
      const uploadName = `${release.slug}-${num}-${cleanTitle}.m4a`;
      const asset = await client.assets.upload("file", buf, {
        filename: uploadName,
        contentType: "audio/mp4",
      });
      // Patch this single track's audio field.
      await client
        .patch(release._id)
        .set({ [`tracklist[_key=="${t._key}"].audio`]: { _type: "file", asset: { _type: "reference", _ref: asset._id } } })
        .commit();
      // Clean up tmp m4a
      if (m4a !== src) await unlink(m4a).catch(() => {});
      console.log(`   ${num} · ${t.title}  ✓ uploaded (${(buf.length / 1024 / 1024).toFixed(1)}MB)`);
      uploaded += 1;
    } catch (err) {
      console.log(`   ${num} · ${t.title}  ✗ ${(err as Error).message}`);
      failed += 1;
    }
  }
  return { tracks: release.tracklist.length, uploaded, skipped, failed };
}

(async () => {
  // Sanity check: afconvert available
  try {
    execSync("which afconvert", { stdio: "ignore" });
  } catch {
    console.error("afconvert not found — this script requires macOS (Mac-only).");
    process.exit(1);
  }

  const slugFilter = ONLY_SLUG ? `&& slug.current == "${ONLY_SLUG}"` : "";
  const labelFilter = ALL_OWNED ? `&& label in $labels` : "";

  const rows = await client.fetch<SanityRelease[]>(
    `*[_type == "release" && (withdrawn != true) ${labelFilter} ${slugFilter}]
      | order(label asc, catalogNumber asc) {
        _id, title, "slug": slug.current, catalogNumber, label,
        "tracklist": tracklist[]{
          _key, title, duration,
          "hasAudio": defined(audio.asset),
          "audioFilename": audio.asset->originalFilename
        }
      }`,
    { labels: OWNED_LABELS }
  );

  if (rows.length === 0) {
    console.log("Nothing to do (no matching release).");
    return;
  }

  console.log(`Processing ${rows.length} release${rows.length === 1 ? "" : "s"}${DRY_RUN ? " (DRY RUN)" : ""}...`);

  let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
  for (const r of rows) {
    if (!r.tracklist || r.tracklist.length === 0) {
      console.log(`\n📀 ${r.catalogNumber ?? "—"}  ${r.title} — skipped (no tracklist)`);
      continue;
    }
    const result = await processRelease(r);
    totalUploaded += result.uploaded;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log(`\n✅ ${totalUploaded} uploaded · ${totalSkipped} skipped · ${totalFailed} failed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
