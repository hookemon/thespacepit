/**
 * Per-release physical-artifact sweep. For each owned release, walk its
 * catalog folder's ART/ subfolder and find scans that aren't the cover —
 * J-cards, cassette layouts, vinyl jacket scans, handwritten notes — and
 * attach them as physicalArtifacts.
 *
 * Heuristic for "this is an artifact, not the cover":
 *   - skip files matching the cover filename (the upload-cover scripts use
 *     `*-3000.*`, `*-cover.*`, `*-4500.*` etc.)
 *   - skip files smaller than 100KB (probably thumbnails or icons)
 *   - skip files with "thumb", "small", "preview" in the name
 *
 * Smart title guesses based on the filename:
 *   - contains "jcard" or "j-card" → "Cassette J-card"
 *   - contains "cassette" / "tape" → "Cassette layout"
 *   - contains "jacket" / "sleeve" / "vinyl" → "Vinyl jacket"
 *   - contains "back" → "Back cover"
 *   - contains "label" → "Label art"
 *   - contains "poster" / "flyer" → "Poster"
 *   - contains "lyric" / "liner" → "Liner notes"
 *   - contains "press" / "1sheet" / "1-sheet" → "Press one-sheet"
 *   - otherwise → "Layout artwork"
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, join, basename } from "path";
import { readdir, stat, readFile } from "fs/promises";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const CATALOG_ROOT = process.env.CC_CATALOG_ROOT!;
const IMPRINT_DIRS: Record<string, string> = {
  "Calm + Collect": "1-Calm + Collect",
  "Calm + Collect Instrumental": "1-Calm + Collect",
  "Lockhart Dynasty × Calm + Collect": "2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)",
  "Hookemon": "3-Hookemon Records",
  "Calllm": "4-CALLLM (Ambient Imprint)",
};
const OWNED = Object.keys(IMPRINT_DIRS);

function titleForFile(filename: string): string {
  const n = basename(filename).toLowerCase();
  if (/\bj[-_ ]?card\b/.test(n)) return "Cassette J-card";
  if (/\bcassette\b|\btape\b/.test(n)) return "Cassette layout";
  if (/\bjacket\b|\bsleeve\b|\bvinyl\b/.test(n)) return "Vinyl jacket";
  if (/\bback\b/.test(n)) return "Back cover";
  if (/\blabel\b/.test(n)) return "Label art";
  if (/\bposter\b|\bflyer\b/.test(n)) return "Poster";
  if (/\blyric|liner|notes\b/.test(n)) return "Liner notes";
  if (/\bpress\b|\b1[-_]?sheet\b|onesheet/.test(n)) return "Press one-sheet";
  return "Layout artwork";
}

async function findReleaseFolder(catalogNumber: string, label: string): Promise<string | null> {
  const imprintDir = IMPRINT_DIRS[label];
  if (!imprintDir) return null;
  const imprintPath = join(CATALOG_ROOT, imprintDir);
  if (!existsSync(imprintPath)) return null;
  const folders = await readdir(imprintPath);
  const cn = catalogNumber.toUpperCase();
  const match = folders.find((f) => new RegExp(`^${cn}([-: ]|$)`).test(f.toUpperCase()));
  return match ? join(imprintPath, match) : null;
}

async function findArtFiles(releaseFolder: string, coverFilename: string | null): Promise<string[]> {
  const artDir = join(releaseFolder, "ART");
  if (!existsSync(artDir)) return [];
  const out: string[] = [];
  async function walk(d: string) {
    let entries: string[];
    try { entries = await readdir(d); } catch { return; }
    for (const name of entries) {
      if (name.startsWith(".")) continue;
      const full = join(d, name);
      const s = await stat(full).catch(() => null);
      if (!s) continue;
      if (s.isDirectory()) await walk(full);
      else if (/\.(jpg|jpeg|png|tif|tiff|gif)$/i.test(name) && s.size > 100_000) {
        // Skip the file if its basename matches the cover (already uploaded).
        if (coverFilename && basename(full).toLowerCase() === coverFilename.toLowerCase()) continue;
        // Skip obvious "small" variants
        if (/\b(thumb|small|preview|low)\b/i.test(name)) continue;
        // Skip files matching common cover-sized naming
        if (/[-_](3000|4500|1500|1200|cover)(?:[-_].*)?\.(jpg|jpeg|png)$/i.test(name)) continue;
        out.push(full);
      }
    }
  }
  await walk(artDir);
  return out;
}

(async () => {
  const releases = await c.fetch<Array<{ _id: string; title: string; slug: string; catalogNumber?: string; label?: string; coverFilename?: string; hasArtifacts: boolean }>>(
    `*[_type == "release" && label in $labels && withdrawn != true] | order(catalogNumber asc) {
      _id, title, "slug": slug.current, catalogNumber, label,
      "coverFilename": cover.asset->originalFilename,
      "hasArtifacts": count(physicalArtifacts) > 0
    }`, { labels: OWNED }
  );
  console.log(`Sweeping ${releases.length} releases for ART/ artifacts (skipping covers)…\n`);
  // Sanity rate limit: 25 req/sec. Pace at ~200ms between uploads = 5/sec
  // with headroom; retry-on-502 in case the upstream blip again.
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  async function uploadWithRetry(buf: Buffer, opts: { filename: string; contentType: string }, attempts = 4) {
    for (let i = 0; i < attempts; i++) {
      try { return await c.assets.upload("image", buf, opts); }
      catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 429 || e.statusCode === 502 || e.statusCode === 503) {
          const wait = 1500 * (i + 1);
          process.stdout.write(` ⏳${e.statusCode},wait ${wait}ms `);
          await delay(wait); continue;
        }
        throw err;
      }
    }
    throw new Error("upload failed after retries");
  }
  let added = 0, releasesTouched = 0, skippedExisting = 0, releaseErrors = 0;
  for (const r of releases) {
    if (!r.catalogNumber || !r.label) continue;
    if (r.hasArtifacts) { skippedExisting += 1; continue; }
    const folder = await findReleaseFolder(r.catalogNumber, r.label);
    if (!folder) continue;
    const arts = await findArtFiles(folder, r.coverFilename ?? null);
    if (arts.length === 0) continue;
    try {
      const artifacts = [];
      for (const path of arts) {
        const buf = await readFile(path);
        const ext = path.split(".").pop()!.toLowerCase();
        const ct = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";
        const fn = `${r.slug}-${basename(path).replace(/\s+/g, "-").toLowerCase()}`;
        const asset = await uploadWithRetry(buf, { filename: fn, contentType: ct });
        artifacts.push({
          _key: randomUUID(), _type: "physicalArtifact",
          image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
          title: titleForFile(path),
        });
        await delay(220);
      }
      await c.patch(r._id).set({ physicalArtifacts: artifacts }).commit();
      console.log(`✓ ${r.catalogNumber.padEnd(9)} ${r.title} — ${artifacts.length} artifact${artifacts.length===1?"":"s"} (${artifacts.map(a=>a.title).join(", ")})`);
      added += artifacts.length; releasesTouched += 1;
    } catch (err) {
      console.log(`✗ ${r.catalogNumber.padEnd(9)} ${r.title} — ${(err as Error).message}`);
      releaseErrors += 1;
    }
    await delay(300);
  }
  console.log(`\n${added} artifacts uploaded across ${releasesTouched} releases · ${skippedExisting} skipped (already had) · ${releaseErrors} errors`);
})().catch((err) => { console.error(err); process.exit(1); });
