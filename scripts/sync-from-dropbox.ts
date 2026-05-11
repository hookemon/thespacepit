/**
 * Sync the Calm + Collect catalogue from the Dropbox folder into Sanity.
 * Source of truth: ~/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT
 *                  CATALOG( CURRENT AS OF Q3 2025)/{imprint}/{release}/
 *
 * Per release folder we expect (any subset works — we fall back gracefully):
 *   - {UPC}_cover.jpg            → cover art (uploaded to Sanity assets)
 *   - {UPC}_metadata.xlsx        → canonical title / artists / year (parsed)
 *   - audios/                    → ignored (Bandcamp embed handles playback)
 *
 * For each release we:
 *   1. Parse cat # from the folder name (CC001, CCINST001, CLM003, LDCC001,
 *      hookemon001, etc.)
 *   2. Read metadata.xlsx if present; fall back to folder-name parse
 *   3. Upload the cover JPG to Sanity (idempotent — same path → reused asset)
 *   4. createOrReplace the release doc
 *
 * Re-run safely as often as you want. Idempotent.
 *
 * Usage: npm run sync   (or: npx tsx scripts/sync-from-dropbox.ts)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve, basename } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT CATALOG( CURRENT AS OF Q3 2025)";

const IMPRINT_DIRS: { dir: string; label: string }[] = [
  { dir: "1-Calm + Collect", label: "Calm + Collect" },
  { dir: "2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)", label: "Lockhart Dynasty × Calm + Collect" },
  { dir: "3-Hookemon Records", label: "Hookemon" },
  { dir: "4-CALLLM (Ambient Imprint)", label: "Calllm" },
];

// ----------------------- helpers -----------------------

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’&]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function extractCatalogNumber(folderName: string): string | null {
  const m = folderName.match(/^(CC\d+|CCINST\d+|CLM\d+|LDCC\d+|hookemon\d+)/i);
  return m ? m[1] : null;
}

// "CC025- Quazzy, Nick Hook- La Burbuja LP" → { artistsRaw: "Quazzy, Nick Hook", title: "La Burbuja LP" }
function parseFolderName(folder: string): { artistsRaw?: string; title?: string } {
  let s = folder;
  const cat = extractCatalogNumber(s);
  if (!cat) return {};
  s = s.slice(cat.length);
  // Sometimes there's a colon then a second cat # (e.g. "CC014: FGR156 Nick Hook - Head ...")
  s = s.replace(/^[\s:]+\s*[A-Z]+\d+\s*/, "");
  s = s.replace(/^\s*[-–—:]\s*/, "");
  // Now s is like "Quazzy, Nick Hook- La Burbuja LP" or "Nick Hook Ft Gangsta Boo-Peephole"
  // Split on the LAST " - " or " — " or hyphen-with-space
  const parts = s.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    const title = parts.pop()!.trim();
    const artistsRaw = parts.join(" - ").trim();
    return { artistsRaw, title };
  }
  return { title: s.trim() };
}

const IMG_RE = /\.(jpg|jpeg|png)$/i;
const SKIP_DIRS = /^(music|stems|remix\s*stems|press|video|videos?\s*content|press shots|pr|For MGMT)$/i;

function walkImages(dir: string, depth = 0, max = 3): string[] {
  if (depth > max) return [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return []; }
  const found: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try { isDir = statSync(full).isDirectory(); } catch { continue; }
    if (isDir) {
      if (SKIP_DIRS.test(entry)) continue;
      found.push(...walkImages(full, depth + 1, max));
    } else if (IMG_RE.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

function pickBestCover(paths: string[]): string | null {
  if (paths.length === 0) return null;
  const sorted = [...paths].sort((a, b) => {
    const score = (p: string) => {
      let s = 0;
      const name = basename(p).toLowerCase();
      // The UPC-prefixed _cover.jpg is the canonical master
      if (/_cover\.(jpg|jpeg|png)$/i.test(name)) s += 5000;
      if (/front/i.test(p)) s += 1000;
      if (/cover/i.test(p)) s += 500;
      if (/album\s*art/i.test(p)) s += 200;
      const m = p.match(/(\d{3,5})x\d{3,5}/i) ?? p.match(/(\d{4})\s*illustration/i);
      if (m) s += parseInt(m[1]) / 100;
      if (/screen\s*shot|GK6A|press|photo|stamps?|insta|social/i.test(p)) s -= 300;
      return s;
    };
    return score(b) - score(a);
  });
  return sorted[0];
}

async function readWithRetry(path: string, attempts = 6): Promise<Buffer> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try { return readFileSync(path); }
    catch (err) {
      lastErr = err as Error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(i + 1, 1.3)));
    }
  }
  throw lastErr ?? new Error("read failed");
}

// Hash-tag the asset by file path so reuploading the same file is cheap.
async function uploadCover(path: string, label: string): Promise<string | null> {
  try {
    const buffer = await readWithRetry(path);
    const ext = path.toLowerCase().endsWith(".png") ? "png" : "jpg";
    const filename = `${label}-cover.${ext}`;
    const asset = await client.assets.upload("image", buffer, {
      filename,
      contentType: ext === "png" ? "image/png" : "image/jpeg",
    });
    return asset._id;
  } catch (err) {
    console.warn(`     ⚠️  cover upload failed: ${(err as Error).message.split("\n")[0]}`);
    return null;
  }
}

// Try to parse {title, year, upc} from the metadata.xlsx — but tolerate any
// shape. We dynamic-import xlsx-parsing only if present; if not, skip.
async function readMetadata(path: string): Promise<{ title?: string; year?: number; upc?: string }> {
  try {
    // Use openpyxl-style parsing via tsv extraction with `python3`. Cheap.
    const { execSync } = await import("child_process");
    const out = execSync(
      `python3 -c "import sys, pandas as pd; df = pd.read_excel(sys.argv[1], sheet_name=0, header=None); print(df.head(20).fillna('').to_csv(sep='\\t', header=False, index=False))" '${path.replace(/'/g, "'\\''")}'`,
      { timeout: 30000 }
    ).toString();
    const result: { title?: string; year?: number; upc?: string } = {};
    for (const line of out.split("\n")) {
      const cells = line.split("\t").map((c) => c.trim());
      if (cells.length < 2) continue;
      const k = (cells[0] ?? "").toLowerCase();
      const v = cells.slice(1).find((c) => c) ?? "";
      if (!v) continue;
      if (/title|track\s*title|release/.test(k) && !result.title) result.title = v;
      if (/upc|barcode/.test(k) && !result.upc) result.upc = v;
      if (/(release\s*date|year)/.test(k)) {
        const m = v.match(/(\d{4})/);
        if (m && !result.year) result.year = parseInt(m[1]);
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ----------------------- main -----------------------

type SyncStats = {
  total: number;
  catalogParsed: number;
  coverUploaded: number;
  metadataParsed: number;
  patched: number;
  skipped: number;
  errors: number;
};

async function sync() {
  const stats: SyncStats = { total: 0, catalogParsed: 0, coverUploaded: 0, metadataParsed: 0, patched: 0, skipped: 0, errors: 0 };
  console.log(`\n🔄  Syncing catalogue from Dropbox\n   ${ROOT}\n`);

  for (const { dir: imprintDir, label: imprintLabel } of IMPRINT_DIRS) {
    const fullImprint = join(ROOT, imprintDir);
    let releaseFolders: string[];
    try {
      releaseFolders = readdirSync(fullImprint).filter((n) => {
        try { return statSync(join(fullImprint, n)).isDirectory(); } catch { return false; }
      });
    } catch (err) {
      console.warn(`  ⚠️  cannot read ${imprintDir}: ${(err as Error).message}`);
      continue;
    }
    console.log(`\n[${imprintLabel}] (${releaseFolders.length} folders)`);

    for (const folder of releaseFolders) {
      stats.total++;
      const releaseDir = join(fullImprint, folder);

      const cat = extractCatalogNumber(folder);
      if (!cat) {
        console.log(`  ⏭  ${folder.slice(0, 50)} — no catalog #`);
        stats.skipped++;
        continue;
      }
      stats.catalogParsed++;

      const { title: parsedTitle, artistsRaw } = parseFolderName(folder);

      // Look up metadata.xlsx
      let entries: string[] = [];
      try { entries = readdirSync(releaseDir); } catch { /* ignore */ }
      const metadataFile = entries.find((f) => /metadata.*\.xlsx?$/i.test(f));
      let metaTitle: string | undefined;
      let metaYear: number | undefined;
      let upc: string | undefined;
      if (metadataFile) {
        const meta = await readMetadata(join(releaseDir, metadataFile));
        metaTitle = meta.title;
        metaYear = meta.year;
        upc = meta.upc;
        if (meta.title || meta.year || meta.upc) stats.metadataParsed++;
      }

      const finalTitle = metaTitle ?? parsedTitle ?? cat;

      // Cover upload
      const allImages = walkImages(releaseDir);
      const coverPath = pickBestCover(allImages);
      let coverAssetId: string | null = null;
      if (coverPath) {
        coverAssetId = await uploadCover(coverPath, cat.toLowerCase());
        if (coverAssetId) stats.coverUploaded++;
      }

      // Find existing release in Sanity by catalog #
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "release" && catalogNumber == $cat][0]{ _id }`,
        { cat }
      );

      type Patch = {
        title?: string;
        year?: number;
        cover?: { _type: "image"; asset: { _type: "reference"; _ref: string } };
      };
      const patch: Patch = {};
      if (metaTitle) patch.title = metaTitle;
      if (metaYear) patch.year = metaYear;
      if (coverAssetId) {
        patch.cover = { _type: "image", asset: { _type: "reference", _ref: coverAssetId } };
      }

      if (existing) {
        // Update only the fields we have fresh data for; leave the rest alone.
        if (Object.keys(patch).length > 0) {
          await client.patch(existing._id).set(patch).commit();
          stats.patched++;
        }
        const bits: string[] = [];
        if (patch.cover) bits.push("cover");
        if (patch.title) bits.push("title");
        if (patch.year) bits.push("year");
        console.log(`  ✓ ${cat} ${(metaTitle ?? parsedTitle ?? "").slice(0, 30).padEnd(30)} ${bits.length ? `→ ${bits.join("+")}` : "(unchanged)"}`);
      } else {
        // Create new (rare — most are seeded already)
        const slug = slugify(`${cat}-${finalTitle}`);
        const _id = `release-${slug}`;
        await client.createOrReplace({
          _id,
          _type: "release",
          title: finalTitle,
          slug: { _type: "slug", current: slug },
          catalogNumber: cat,
          year: metaYear,
          label: imprintLabel,
          artists: [],
          ...(coverAssetId && { cover: { _type: "image", asset: { _type: "reference", _ref: coverAssetId } } }),
        });
        stats.patched++;
        console.log(`  ✨ ${cat} CREATED: ${finalTitle.slice(0, 40)}${artistsRaw ? `  (artists: ${artistsRaw.slice(0, 40)} — link refs by hand in /studio)` : ""}`);
      }
    }
  }

  console.log(`\n✅ sync complete`);
  console.log(`   ${stats.total} folders scanned`);
  console.log(`   ${stats.catalogParsed} cat numbers parsed`);
  console.log(`   ${stats.metadataParsed} metadata files read`);
  console.log(`   ${stats.coverUploaded} covers uploaded`);
  console.log(`   ${stats.patched} releases patched/created`);
  console.log(`   ${stats.skipped} skipped (no cat #)`);
  if (stats.errors) console.log(`   ${stats.errors} errors`);
}

sync().catch((err) => {
  console.error("\n❌ sync failed:", err);
  process.exit(1);
});
