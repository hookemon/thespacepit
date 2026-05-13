/**
 * Bulk flyer importer.
 *
 * Walks a curated list of flyer-rich folders on the JaySounds drive +
 * local Dropbox, resizes each image with `sips`, uploads to Sanity, then
 * creates an idempotent `flyer` doc tagged according to the source folder.
 *
 * Idempotency: doc _id is SHA-256 of the source file bytes — re-runs are
 * no-ops on already-imported flyers.
 *
 * Run: `npx tsx scripts/import-flyers-bulk.ts`
 * Dry: `npx tsx scripts/import-flyers-bulk.ts --dry`
 * Source filter: `npx tsx scripts/import-flyers-bulk.ts --source=collage-invites`
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

const DRY = process.argv.includes("--dry");
const SOURCE_FILTER = (() => {
  const a = process.argv.find((x) => x.startsWith("--source="));
  return a ? a.slice("--source=".length) : null;
})();

type Source = {
  id: string;
  path: string;
  recursive?: boolean;
  kind: string;
  tags: string[];
  relatedReleaseSlug?: string;
  relatedEraSlug?: string;
  city?: string;
  venue?: string;
  year?: number;
  titlePrefix?: string;
  /** When set, ONLY ingest files whose name matches this pattern.
   *  Used for mixed-content folders (e.g. RETURN 2 WATER MEXICO has 184
   *  images but only 8 are flyers — filter to filenames with FLYER/POSTER/
   *  INVITE in them). */
  filenameMustMatch?: RegExp;
};

const SOURCES: Source[] = [
  // ── Collage v.1 release party invites (NYC + LA) ─────────
  {
    id: "collage-invites",
    path: "/Volumes/JaySounds/SERATO PRESSING MASTER/COLLAGE NINJA TUNE SERATO/RELEASE PARTY INVITES",
    kind: "release-party",
    tags: ["collage", "release-party", "calm-collect"],
    relatedReleaseSlug: "cc012-collage-v-1",
    year: 2014,
    titlePrefix: "Collage v.1 release party",
  },
  // ── 50 Backwoods 10-city tour posters ─────────────────────
  {
    id: "50bws-tour-posters",
    path: "/Volumes/JaySounds/DECEMBER 2024 DROPBOX /PRODUCTION/50 BACKWOODS/50 BACKWOODS TOUR POSTERS",
    recursive: true,
    kind: "tour-poster",
    tags: ["50-backwoods", "tour", "calm-collect"],
    relatedReleaseSlug: "cc017-50-backwoods",
    year: 2017,
    titlePrefix: "50 Backwoods tour",
  },
  // ── Halloween flyers ──────────────────────────────────────
  {
    id: "halloween",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/BOO VAULT/HALLOWEEN FLYERS",
    kind: "show",
    tags: ["halloween", "boo", "spacepit"],
    titlePrefix: "Nick Hook + Friends Halloween",
  },
  // ── 2016 / 2017 mixed flyer dump (Dropbox curated) ────────
  {
    id: "flyers-2016-2017",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/HOOK MARCH 2025 REORGANIZE/FLYERS 2017 2016  jpegs",
    kind: "show",
    tags: ["spacepit"],
    titlePrefix: "2016-2017 era flyer",
  },
  // ── Mexico era flyers (Return 2 Water film stash) ─────────
  // Mixed-content folder (184 jpgs total — most are general photos, only
  // ~8 are actual flyers). Filter to filenames with FLYER/POSTER/INVITE.
  {
    id: "mexico-flyers",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/RETURN 2 WATER FILM/ MEXICO",
    kind: "show",
    tags: ["mexico", "spacepit"],
    city: "Mexico City",
    titlePrefix: "CDMX era",
    filenameMustMatch: /flyer|poster|invite/i,
  },
  // ── Like Water release-art flyers ─────────────────────────
  {
    id: "like-water-flyers",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT CATALOG( CURRENT AS OF Q3 2025)/CC002 NIck Hook- Like Water/ART/FLYERS",
    kind: "release-party",
    tags: ["calm-collect", "release-party"],
    titlePrefix: "Like Water (CC002)",
  },
  // ── Calm + Collect Livestream Flyers ──────────────────────
  {
    id: "cc-livestream",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/untitled folder/CC ART MASTER/CC Design Files/Livestream Flyers",
    kind: "show",
    tags: ["calm-collect"],
    titlePrefix: "Calm + Collect livestream",
  },
  // ── BOO FOLDER FRESH (RTJ poster, Zokhuma, Gehto Gothik) ──
  // Mixed content folder — filter to flyer-named files only.
  {
    id: "boo-fresh-flyers",
    path: "/Users/nickhook/Library/CloudStorage/Dropbox/RELATIONSHIPS 2023/BOO FOLDER FRESH/FRESH",
    kind: "show",
    tags: ["boo", "spacepit"],
    titlePrefix: "Boo era flyer",
    filenameMustMatch: /flyer|poster|invite/i,
  },
  // ── OG PLUGS (early party flyers) ─────────────────────────
  // Also mixed-content — filter to flyer-named files.
  {
    id: "og-plugs",
    path: "/Volumes/JaySounds/OG PLUGS/PHOTo backup",
    kind: "show",
    tags: ["spacepit"],
    titlePrefix: "OG Plugs",
    filenameMustMatch: /flyer|poster|invite/i,
  },
];

const FLYER_EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".pdf"]);
const MAX_BYTES = 30 * 1024 * 1024;

function listImages(path: string, recursive: boolean, mustMatch?: RegExp): string[] {
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
        if (!FLYER_EXTS.has(ext)) continue;
        if (s.size > MAX_BYTES || s.size < 5 * 1024) continue;
        if (mustMatch && !mustMatch.test(name)) continue;
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
  return `flyer-bulk-${h}`;
}

const TMP = "/tmp/spacepit-flyer-import";
mkdirSync(TMP, { recursive: true });

async function resolveProjectRef(slug?: string): Promise<string | null> {
  if (!slug) return null;
  return await c.fetch(`*[_type == "project" && slug.current == $slug][0]._id`, { slug });
}
async function resolveReleaseRef(slug?: string): Promise<string | null> {
  if (!slug) return null;
  return await c.fetch(`*[_type == "release" && slug.current == $slug][0]._id`, { slug });
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const sourcesToRun = SOURCE_FILTER ? SOURCES.filter((s) => s.id === SOURCE_FILTER) : SOURCES;
  console.log(`\n🪧  Bulk flyer import — ${sourcesToRun.length} source(s)${DRY ? " (DRY)" : ""}\n`);
  let totalCreated = 0, totalSkipped = 0, totalErrors = 0;

  for (const src of sourcesToRun) {
    const files = listImages(src.path, src.recursive ?? false, src.filenameMustMatch);
    if (files.length === 0) {
      console.log(`   · [${src.id}] no flyer images at ${src.path}`);
      continue;
    }
    console.log(`\n── [${src.id}] ${files.length} flyer images`);

    const eraRef = await resolveProjectRef(src.relatedEraSlug);
    const releaseRef = await resolveReleaseRef(src.relatedReleaseSlug);

    let srcCreated = 0, srcSkipped = 0, srcErrors = 0;

    for (const filePath of files) {
      const _id = fileHashId(filePath);
      const fname = basename(filePath);
      const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });
      if (existing) { srcSkipped++; totalSkipped++; continue; }

      if (DRY) {
        console.log(`   + [${src.id}] would import: ${fname}`);
        srcCreated++; totalCreated++; continue;
      }

      // Resize ≤ 2400px longest edge (a touch larger than photos so flyer
      // type stays sharp), JPEG 88, but skip the resize for PDFs.
      const ext = extname(fname).toLowerCase();
      const isPdf = ext === ".pdf";
      let bufToUpload: Buffer;
      let contentType = "image/jpeg";
      let uploadFname = fname.replace(/\.(jpe?g|png|tif{1,2}|gif)$/i, ".jpg");
      try {
        if (isPdf) {
          bufToUpload = readFileSync(filePath);
          contentType = "application/pdf";
          uploadFname = fname;
        } else {
          const tmpPath = join(TMP, `${_id}.jpg`);
          execSync(
            `sips -Z 2400 -s format jpeg -s formatOptions 88 "${filePath}" --out "${tmpPath}"`,
            { stdio: "pipe" }
          );
          bufToUpload = readFileSync(tmpPath);
          try { unlinkSync(tmpPath); } catch {}
        }
      } catch {
        console.log(`   ✗ [${src.id}] sips/read failed: ${fname}`);
        srcErrors++; totalErrors++; continue;
      }

      let assetRef: string;
      try {
        const asset = await c.assets.upload("image", bufToUpload, { filename: uploadFname, contentType });
        assetRef = asset._id;
      } catch (e: any) {
        console.log(`   ✗ [${src.id}] upload failed for ${fname}: ${e?.message ?? e}`);
        srcErrors++; totalErrors++;
        await sleep(500);
        continue;
      }

      // Title generation
      const captionBase = fname
        .replace(/\.[a-z]+$/i, "")
        .replace(/[_-]+/g, " ")
        .replace(/^\d+\s+/, "")
        .trim();
      const title = src.titlePrefix
        ? (captionBase.length > 1 ? `${src.titlePrefix} · ${captionBase}` : src.titlePrefix)
        : captionBase;

      const doc: Record<string, unknown> = {
        _id,
        _type: "flyer",
        image: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
        title,
        kind: src.kind,
        ...(src.year ? { year: src.year } : {}),
        ...(src.city ? { city: src.city } : {}),
        ...(src.venue ? { venue: src.venue } : {}),
        ...(src.tags.length > 0 ? { tags: src.tags } : {}),
        ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
        ...(releaseRef ? { relatedRelease: { _type: "reference", _ref: releaseRef } } : {}),
        sourceUrl: filePath,
      };

      try {
        await c.create(doc);
        srcCreated++; totalCreated++;
      } catch (e: any) {
        console.log(`   ✗ [${src.id}] doc create failed for ${fname}: ${e?.message ?? e}`);
        srcErrors++; totalErrors++;
      }
      await sleep(300);
    }

    console.log(`   ✓ [${src.id}] ${srcCreated} created · ${srcSkipped} already there · ${srcErrors} errors`);
  }

  console.log(`\n✅ ${totalCreated} created · ${totalSkipped} already there · ${totalErrors} errors\n`);
})();
