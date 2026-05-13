/**
 * Bulk photo importer.
 *
 * Walks a curated list of source folders on the mounted drives + local
 * Dropbox, resizes each image with `sips` (macOS built-in) to a sane web
 * size, uploads it to Sanity as an asset, then creates an idempotent
 * `photo` doc tagged according to where the image came from.
 *
 * Idempotency: doc _id is derived from a SHA-256 of the SOURCE FILE BYTES,
 * so re-running the script (or running it after Nick adds more photos to
 * a folder) only creates new docs for genuinely new photos. Already-uploaded
 * files are skipped silently.
 *
 * Resize: sips -Z 2000 (longest edge max 2000px) → roughly halves storage,
 * preserves visual fidelity. Original files are NEVER modified — sips
 * outputs to a temp dir.
 *
 * Rate limiting: 350ms delay between Sanity upload calls to stay well
 * under the 25/sec asset upload limit.
 *
 * Run: `npx tsx scripts/import-photos-bulk.ts`
 * Dry: `npx tsx scripts/import-photos-bulk.ts --dry`
 * Limit (smoke test): `npx tsx scripts/import-photos-bulk.ts --limit=10`
 * Source filter: `npx tsx scripts/import-photos-bulk.ts --source=studio-doc`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, readFileSync, mkdirSync, statSync, readdirSync, unlinkSync } from "fs";
import { resolve, basename, extname, join } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// ── CLI ─────────────────────────────────────────────────────────
const DRY = process.argv.includes("--dry");
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.slice("--limit=".length), 10) : Infinity;
})();
const SOURCE_FILTER = (() => {
  const a = process.argv.find((x) => x.startsWith("--source="));
  return a ? a.slice("--source=".length) : null;
})();

// ── Source map ──────────────────────────────────────────────────
// Each entry describes ONE folder we want to ingest. The fields drive
// what tags / kind / era get attached to every photo from that folder
// without needing per-file metadata. If you want a single source to
// span multiple subfolders, add them as separate entries.
type Source = {
  id: string;                      // short slug for --source filter + logging
  path: string;                    // absolute path
  recursive?: boolean;             // walk subfolders (default false — top-level only)
  kind: string;                    // photo doc `kind` field
  tags: string[];                  // photo doc `tags` array
  relatedEraSlug?: string;         // optional project ref
  relatedArtistSlug?: string;      // optional artist ref
  captionPrefix?: string;          // human-readable label (e.g. "thespacepit · ")
  year?: number;                   // year stamp for context
  photographer?: string;           // optional photographer credit
};

const SOURCES: Source[] = [
  // ─── thespacepit studio doc photos (period 2014-2017) ───────
  {
    id: "studio-doc",
    path: "/Volumes/JaySounds/THESPACEPIT DOC STUFF",
    kind: "studio",
    tags: ["spacepit", "studio"],
    captionPrefix: "thespacepit / studio doc",
  },
  // ─── 2015 album art / Collage v.1 era photoshoot ────────────
  {
    id: "art-2015",
    path: "/Volumes/JaySounds/DROPBOX 2024 PART 2/2015 album art shit",
    kind: "artwork",
    tags: ["spacepit"],
    year: 2015,
    captionPrefix: "2015 album art",
  },
  // ─── Relationships LP art ideas / mood references ───────────
  {
    id: "relationships-art-ideas",
    path: "/Volumes/JaySounds/RELATIONSHIPS MASTER FILE/RELATIONSHIPS NEW MAIN SHITTTTTTT/ART IDEAS",
    kind: "artwork",
    tags: ["spacepit"],
    year: 2016,
    captionPrefix: "Relationships LP art idea",
  },
  // ─── Curated press shots (local Dropbox) ────────────────────
  {
    id: "press-shots",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/NICK HOOK PHOTOS/photos",
    kind: "press",
    tags: ["press-shot", "epk"],
    captionPrefix: "press shot",
  },
  // ─── HOOK PICS (older curated grab-bag) ─────────────────────
  {
    id: "hook-pics-old",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/NICK HOOK PHOTOS/HOOK PICS",
    kind: "portrait",
    tags: ["spacepit"],
    captionPrefix: "Hook Pics archive",
  },
  // ─── HOOK PICS via JaySounds (DSC04xxx series) ──────────────
  {
    id: "hook-pics-jaysounds",
    path: "/Volumes/JaySounds/DECEMBER 2024 DROPBOX /PHOTOS VIDEO/HOOK PICS",
    kind: "portrait",
    tags: ["press-shot"],
    captionPrefix: "Hook Pics (Jay archive)",
  },
  // ─── MWC era 2005-2007 (Nikon D70s / E995 + PS exports) ─────
  {
    id: "mwc",
    path: "/Volumes/T7/MEN WOMEN AND CHILDREN/PHOTOS FROM RECOVERD DRIVE",
    kind: "bts",
    tags: ["mwc"],
    relatedEraSlug: "men-women-children",
    year: 2006,
    captionPrefix: "MWC era",
  },
  // ─── Cubic Zirconia tour 2010-2012 (35mm scans) ─────────────
  {
    id: "cz-tour",
    path: "/Volumes/T7/NICK HOOK 2024 REORGANIZE/Cubic Zirconia Tour",
    kind: "live",
    tags: ["cubic-zirconia", "tour"],
    relatedEraSlug: "cubic-zirconia",
    year: 2011,
    captionPrefix: "Cubic Zirconia tour",
  },
  // ─── BOO VAULT (Gangsta Boo sessions / portraits) ───────────
  // Recursive — has many subfolders
  {
    id: "boo-vault",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT",
    recursive: true,
    kind: "session",
    tags: ["session"],
    captionPrefix: "Boo vault",
  },
  // ─── OLD PICS FROM LIES (vintage MWC / CZ era candids) ──────
  {
    id: "old-pics-from-lies",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/NICK HOOK PHOTOS/OLD PICS FROM LIES",
    kind: "portrait",
    tags: ["mwc"],
    captionPrefix: "Old pics (from Lies)",
  },
  // ─── NICK HOOK selects (curated set Nick picked) ────────────
  {
    id: "nick-hook-selects",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/NICK HOOK PHOTOS/NICK HOOK selects",
    kind: "press",
    tags: ["press-shot", "epk"],
    captionPrefix: "Nick Hook selects",
  },
];

// ── Helpers ─────────────────────────────────────────────────────
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff", ".gif", ".webp"]);
const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // skip files >25MB to avoid context blowups during resize

function listImages(path: string, recursive: boolean): string[] {
  if (!existsSync(path)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      if (name.startsWith(".") || name.startsWith("._")) continue;
      const full = join(dir, name);
      let s;
      try { s = statSync(full); } catch { continue; }
      if (s.isDirectory()) {
        if (recursive) walk(full);
      } else if (s.isFile()) {
        const ext = extname(name).toLowerCase();
        if (!IMAGE_EXTS.has(ext)) continue;
        if (s.size > MAX_SOURCE_BYTES) continue;
        if (s.size < 5 * 1024) continue; // skip tiny / corrupt files
        out.push(full);
      }
    }
  };
  walk(path);
  return out;
}

function fileHashId(filePath: string): string {
  const buf = readFileSync(filePath);
  const h = createHash("sha256").update(buf).digest("hex").slice(0, 24);
  return `photo-bulk-${h}`;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const TMP = "/tmp/spacepit-photo-import";
mkdirSync(TMP, { recursive: true });

async function resolveProjectRef(slug?: string): Promise<string | null> {
  if (!slug) return null;
  return await c.fetch(`*[_type == "project" && slug.current == $slug][0]._id`, { slug });
}
async function resolveArtistRef(slug?: string): Promise<string | null> {
  if (!slug) return null;
  return await c.fetch(`*[_type == "artist" && slug.current == $slug][0]._id`, { slug });
}

// ── Main ────────────────────────────────────────────────────────
(async () => {
  const sourcesToRun = SOURCE_FILTER ? SOURCES.filter((s) => s.id === SOURCE_FILTER) : SOURCES;
  console.log(`\n📷 Bulk photo import — ${sourcesToRun.length} source(s)${DRY ? " (DRY)" : ""}${LIMIT < Infinity ? `, limit ${LIMIT}` : ""}\n`);

  let totalCreated = 0, totalSkipped = 0, totalErrors = 0, totalSeen = 0;

  for (const src of sourcesToRun) {
    const files = listImages(src.path, src.recursive ?? false).slice(0, LIMIT);
    if (files.length === 0) {
      console.log(`   · [${src.id}] no images at ${src.path}`);
      continue;
    }
    console.log(`\n── [${src.id}] ${files.length} images from ${src.path}`);

    // Resolve refs once per source
    const eraRef = await resolveProjectRef(src.relatedEraSlug);
    const artistRef = await resolveArtistRef(src.relatedArtistSlug);

    let srcCreated = 0, srcSkipped = 0, srcErrors = 0;

    for (const filePath of files) {
      totalSeen++;
      const _id = fileHashId(filePath);
      const fname = basename(filePath);

      // Already imported?
      const existing = await c.fetch(`*[_id == $id][0]{ _id }`, { id: _id });
      if (existing) {
        srcSkipped++;
        totalSkipped++;
        continue;
      }

      if (DRY) {
        console.log(`   + [${src.id}] would import: ${fname.padEnd(40)} → ${_id}`);
        srcCreated++; totalCreated++;
        continue;
      }

      // Resize to ≤ 2000px longest edge, JPEG quality ~85
      const tmpPath = join(TMP, `${_id}.jpg`);
      try {
        execSync(
          `sips -Z 2000 -s format jpeg -s formatOptions 85 "${filePath}" --out "${tmpPath}"`,
          { stdio: "pipe" }
        );
      } catch (e) {
        console.log(`   ✗ [${src.id}] sips failed: ${fname}`);
        srcErrors++; totalErrors++;
        continue;
      }

      // Upload to Sanity as asset
      let assetRef: string;
      try {
        const buf = readFileSync(tmpPath);
        const asset = await c.assets.upload("image", buf, { filename: fname, contentType: "image/jpeg" });
        assetRef = asset._id;
      } catch (e: any) {
        console.log(`   ✗ [${src.id}] upload failed for ${fname}: ${e?.message ?? e}`);
        srcErrors++; totalErrors++;
        try { unlinkSync(tmpPath); } catch {}
        await sleep(500);
        continue;
      }

      // Build photo doc
      const captionBase = fname.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ");
      const caption = src.captionPrefix ? `${src.captionPrefix} · ${captionBase}` : captionBase;

      const doc: Record<string, unknown> = {
        _id,
        _type: "photo",
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: assetRef },
        },
        caption,
        kind: src.kind,
        ...(src.year ? { year: src.year } : {}),
        ...(src.photographer ? { photographer: src.photographer } : {}),
        ...(src.tags.length > 0 ? { tags: src.tags } : {}),
        ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
        ...(artistRef ? { relatedArtist: { _type: "reference", _ref: artistRef } } : {}),
        sourceUrl: filePath, // store the original drive path so we can dedupe / re-link later
      };

      try {
        await c.create(doc);
        srcCreated++; totalCreated++;
        if (srcCreated % 25 === 0) console.log(`   … [${src.id}] ${srcCreated} so far`);
      } catch (e: any) {
        console.log(`   ✗ [${src.id}] doc create failed for ${fname}: ${e?.message ?? e}`);
        srcErrors++; totalErrors++;
      }

      try { unlinkSync(tmpPath); } catch {}
      await sleep(350);
    }

    console.log(`   ✓ [${src.id}] ${srcCreated} created · ${srcSkipped} already there · ${srcErrors} errors`);
  }

  console.log(`\n✅ Done. ${totalCreated} created · ${totalSkipped} already there · ${totalErrors} errors · ${totalSeen} files seen${DRY ? " (DRY)" : ""}\n`);
})();
