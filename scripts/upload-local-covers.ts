/**
 * Walks the local Calm + Collect Dropbox catalog folder and uploads every
 * release's cover JPG to Sanity, attaching it to the matching release.
 *
 * Folder shape per release: <CatNum> <Artists> - <Title>/
 *   - XXXXXXXXX_cover.jpg
 *   - XXXXXXXXX_metadata.xlsx
 *   - audios/
 *
 * We match Sanity releases by catalog number. High-quality local JPG overrides
 * any cover previously scraped from Bandcamp.
 *
 * Run: npx tsx scripts/upload-local-covers.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT CATALOG( CURRENT AS OF Q3 2025)";
const IMPRINT_DIRS = [
  "1-Calm + Collect",
  "2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)",
  "3-Hookemon Records",
  "4-CALLLM (Ambient Imprint)",
];

function extractCatalogNumber(folderName: string): string | null {
  // Match patterns like CC025, CCINST001, CLM003, LDCC001, hookemon001
  const m = folderName.match(/^(CC\d+|CCINST\d+|CLM\d+|LDCC\d+|hookemon\d+)/i);
  return m ? m[1] : null;
}

const IMG_RE = /\.(jpg|jpeg|png)$/i;

// Walk a directory tree (max 3 levels deep) collecting image paths.
// Skips folders named "REMIX STEMS", "MUSIC", "PRESS" etc. — we want art only.
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

// Pick the best cover from a list of image paths.
// Prefer images whose path contains "front", then "cover", then biggest.
function pickBest(paths: string[]): string | null {
  if (paths.length === 0) return null;
  const sorted = [...paths].sort((a, b) => {
    const score = (p: string) => {
      let s = 0;
      if (/front/i.test(p)) s += 1000;
      if (/cover/i.test(p)) s += 500;
      // Prefer "ALBUM ART" folder over generic "ART"
      if (/album\s*art/i.test(p)) s += 200;
      // Prefer bigger images by filename hint
      const m = p.match(/(\d{3,5})x\d{3,5}/i) ?? p.match(/(\d{4})\s*illustration/i);
      if (m) s += parseInt(m[1]) / 100;
      // Penalize images that look like screenshots / press / behind-the-scenes
      if (/screen\s*shot|GK6A|press|photo|stamps?/i.test(p)) s -= 200;
      return s;
    };
    return score(b) - score(a);
  });
  return sorted[0];
}

// Cover lookup — walks up to 3 levels deep into the release folder, skipping
// MUSIC/PRESS/VIDEO subfolders, then picks the most-cover-y image found.
function findCoverJpg(dir: string): string | null {
  const allImages = walkImages(dir);
  return pickBest(allImages);
}

async function readWithRetry(path: string, attempts = 8): Promise<Buffer> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return readFileSync(path);
    } catch (err) {
      lastErr = err as Error;
      // Dropbox on-demand — wait + retry to give it time to download.
      // Quadratic backoff up to ~36s on the last attempt.
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(i + 1, 1.4)));
    }
  }
  throw lastErr ?? new Error("read failed");
}

(async () => {
  console.log(`\n📁 Scanning ${ROOT}\n`);

  let attempted = 0;
  let uploaded = 0;
  let skipped = 0;

  for (const imprintDir of IMPRINT_DIRS) {
    const fullImprintPath = join(ROOT, imprintDir);
    let releaseFolders: string[];
    try {
      releaseFolders = readdirSync(fullImprintPath).filter((name) => {
        try { return statSync(join(fullImprintPath, name)).isDirectory(); } catch { return false; }
      });
    } catch {
      console.warn(`  ⚠️  cannot read ${imprintDir}`);
      continue;
    }
    console.log(`\n[${imprintDir}] (${releaseFolders.length} folders)`);

    for (const folder of releaseFolders) {
      const catNum = extractCatalogNumber(folder);
      if (!catNum) {
        console.log(`  ⏭  ${folder} → no catalog number`);
        skipped++;
        continue;
      }
      const releaseDir = join(fullImprintPath, folder);
      const coverPath = findCoverJpg(releaseDir);
      if (!coverPath) {
        console.log(`  ⏭  ${catNum} → no cover JPG`);
        skipped++;
        continue;
      }
      attempted++;

      // Find Sanity release by catalog number
      const releaseDoc = await client.fetch<{ _id: string } | null>(
        `*[_type == "release" && catalogNumber == $cat][0]{ _id }`,
        { cat: catNum }
      );
      if (!releaseDoc) {
        console.log(`  ⚠️  ${catNum} → no matching release in Sanity (folder: ${folder.slice(0, 60)})`);
        skipped++;
        continue;
      }

      try {
        const buffer = await readWithRetry(coverPath);
        const filename = `${catNum.toLowerCase()}-cover.jpg`;
        const asset = await client.assets.upload("image", buffer, {
          filename,
          contentType: coverPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
        });
        await client
          .patch(releaseDoc._id)
          .set({ cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
          .commit();
        uploaded++;
        console.log(`  ✓ ${catNum} → uploaded ${(buffer.length / 1024).toFixed(0)}KB`);
      } catch (err) {
        // Most common cause: Dropbox on-demand sync timed out fetching the file.
        // Logging and moving on — we'll re-run when the user has the file local.
        console.warn(`  ⚠️  ${catNum} → ${(err as Error).message.split("\n")[0]}`);
        skipped++;
      }
    }
  }

  console.log(`\n✅ Done. uploaded ${uploaded}/${attempted} covers. ${skipped} skipped.`);
})();
