/**
 * PIT-PHYSICAL importer.
 *
 * Walks `~/Library/CloudStorage/Dropbox/PIT-PHYSICAL/{release-slug}/` and
 * attaches each photo to the matching release's `linerNotes[]` or
 * `physicalArtifacts[]` array depending on the filename prefix.
 *
 * Folder convention (just drop files in — no manual tagging needed):
 *
 *   /PIT-PHYSICAL/
 *     cc015-relationships/
 *       liner-back-cover.jpg            → linerNotes[]
 *       liner-gatefold-left.jpg         → linerNotes[]
 *       liner-insert-thank-yous.jpg     → linerNotes[]
 *       artifact-test-pressing-001.jpg  → physicalArtifacts[] (kind: test-pressing)
 *       artifact-vinyl-jacket.jpg       → physicalArtifacts[] (kind: vinyl-jacket)
 *       artifact-cassette-jcard.jpg     → physicalArtifacts[] (kind: cassette)
 *       artifact-handwritten.jpg        → physicalArtifacts[] (kind: handwritten)
 *       artifact-plaque-riaa-gold.jpg   → physicalArtifacts[] (kind: plaque)
 *
 * Filename rules:
 *   · Anything starting `liner-`     → liner notes (the printed pages)
 *   · Anything starting `artifact-`  → physical artifact
 *     - The next token (after `artifact-`) determines `kind` if it matches
 *       a schema enum value (test-pressing / vinyl-jacket / cd-jewel /
 *       cassette / master-tape / handwritten / plaque / other).
 *     - Anything else → kind: other
 *   · Anything else gets logged as "unrouted" and skipped (so misnamed
 *     files don't accidentally become liner notes).
 *
 * Idempotent — file SHA-256 hash determines the asset filename so re-runs
 * skip files that have already been ingested for that release.
 *
 * Run: `npx tsx scripts/import-physical-bulk.ts`
 * Dry: `npx tsx scripts/import-physical-bulk.ts --dry`
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

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/PIT-PHYSICAL";
const TMP = "/tmp/spacepit-physical-import";
mkdirSync(TMP, { recursive: true });

const ARTIFACT_KINDS = new Set([
  "test-pressing", "vinyl-jacket", "cd-jewel", "cassette",
  "master-tape", "handwritten", "plaque", "other",
]);

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff"]);

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 24);
}

function classify(filename: string): { route: "liner" | "artifact" | null; kind?: string } {
  const stem = filename.replace(/\.[a-z]+$/i, "").toLowerCase();
  if (stem.startsWith("liner-") || stem.startsWith("liner_")) return { route: "liner" };
  if (stem.startsWith("artifact-") || stem.startsWith("artifact_")) {
    const rest = stem.replace(/^artifact[-_]/, "");
    // Try to match the longest known kind prefix (e.g. "test-pressing-001" → "test-pressing")
    let kind = "other";
    for (const k of ARTIFACT_KINDS) {
      if (rest === k || rest.startsWith(`${k}-`) || rest.startsWith(`${k}_`)) {
        kind = k;
        break;
      }
    }
    return { route: "artifact", kind };
  }
  return { route: null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!existsSync(ROOT)) {
    console.log(`\n📦 PIT-PHYSICAL folder not found at ${ROOT}`);
    console.log(`   Create it + drop your first liner-/artifact- file in a /<release-slug>/ subfolder when ready.\n`);
    return;
  }

  const releaseSlugs = readdirSync(ROOT).filter((n) => !n.startsWith("."));
  if (releaseSlugs.length === 0) {
    console.log(`\n📦 PIT-PHYSICAL is empty — drop your first scan in a release-slug subfolder.\n`);
    return;
  }

  console.log(`\n📦 PIT-PHYSICAL importer — ${releaseSlugs.length} release folder(s)${DRY ? " (DRY)" : ""}\n`);

  let totalLiners = 0, totalArtifacts = 0, totalSkipped = 0, totalUnrouted = 0;

  for (const slug of releaseSlugs) {
    const dir = join(ROOT, slug);
    if (!statSync(dir).isDirectory()) continue;

    // Resolve release doc by slug
    const release = await c.fetch(
      `*[_type == "release" && slug.current == $slug][0]{ _id, title, "linerNotes": linerNotes, "physicalArtifacts": physicalArtifacts }`,
      { slug }
    );
    if (!release) {
      console.log(`   ✗ ${slug} — no release doc with that slug, skipping (rename folder or create the release doc first)`);
      continue;
    }

    const files = readdirSync(dir)
      .filter((n) => !n.startsWith(".") && !n.startsWith("._"))
      .filter((n) => IMG_EXTS.has(extname(n).toLowerCase()))
      .sort();

    if (files.length === 0) {
      console.log(`   · ${slug} — no images in folder`);
      continue;
    }
    console.log(`\n── [${slug}] ${release.title} — ${files.length} files`);

    const existingLiners: any[] = release.linerNotes ?? [];
    const existingArtifacts: any[] = release.physicalArtifacts ?? [];
    // Track sourceUrls already-imported for dedup (we stash filename hash
    // in the asset filename suffix so we can detect re-runs cheaply)
    const seen = new Set<string>([
      ...existingLiners.map((p:any) => p.image?.asset?._ref ?? "").filter(Boolean),
      ...existingArtifacts.map((p:any) => p.image?.asset?._ref ?? "").filter(Boolean),
    ]);

    const newLiners: any[] = [];
    const newArtifacts: any[] = [];

    for (const fname of files) {
      const full = join(dir, fname);
      const { route, kind } = classify(fname);
      if (!route) {
        console.log(`   ? unrouted: ${fname} (rename to start with liner- or artifact-)`);
        totalUnrouted++;
        continue;
      }
      const hash = hashFile(full);
      const tmpPath = join(TMP, `${hash}.jpg`);

      if (DRY) {
        console.log(`   + would import as ${route}${kind ? ` (${kind})` : ""}: ${fname}`);
        if (route === "liner") totalLiners++; else totalArtifacts++;
        continue;
      }

      // Resize ≤ 2400px, JPEG 88
      try {
        execSync(
          `sips -Z 2400 -s format jpeg -s formatOptions 88 "${full}" --out "${tmpPath}"`,
          { stdio: "pipe" }
        );
      } catch {
        console.log(`   ✗ sips failed: ${fname}`);
        continue;
      }

      let assetRef: string;
      try {
        const asset = await c.assets.upload("image", readFileSync(tmpPath), {
          filename: `${hash}-${fname}`,
          contentType: "image/jpeg",
        });
        assetRef = asset._id;
      } catch (e: any) {
        console.log(`   ✗ upload failed for ${fname}: ${e?.message ?? e}`);
        try { unlinkSync(tmpPath); } catch {}
        continue;
      }
      try { unlinkSync(tmpPath); } catch {}

      // Skip if this asset already in the release
      if (seen.has(assetRef)) {
        console.log(`   · already imported: ${fname}`);
        totalSkipped++;
        continue;
      }
      seen.add(assetRef);

      // Pretty caption from filename
      const caption = fname
        .replace(/\.[a-z]+$/i, "")
        .replace(/^(liner|artifact)[-_]/i, "")
        .replace(/^[a-z-]+[-_]/i, "")  // strip kind prefix (test-pressing-, vinyl-jacket-, etc.)
        .replace(/[_-]+/g, " ")
        .trim();

      if (route === "liner") {
        newLiners.push({
          _key: createHash("sha1").update(assetRef).digest("hex").slice(0, 8),
          image: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
          caption: caption || undefined,
        });
        totalLiners++;
        console.log(`   + LINER     ${fname}`);
      } else {
        newArtifacts.push({
          _key: createHash("sha1").update(assetRef).digest("hex").slice(0, 8),
          image: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
          title: caption || undefined,
          kind,
        });
        totalArtifacts++;
        console.log(`   + ARTIFACT  ${fname} → kind=${kind}`);
      }

      await sleep(300);
    }

    if (DRY || (newLiners.length === 0 && newArtifacts.length === 0)) continue;

    const patch = c.patch(release._id);
    if (newLiners.length > 0) patch.set({ linerNotes: [...existingLiners, ...newLiners] });
    if (newArtifacts.length > 0) patch.set({ physicalArtifacts: [...existingArtifacts, ...newArtifacts] });
    await patch.commit();
  }

  console.log(`\n✅ ${totalLiners} liner pages · ${totalArtifacts} artifacts · ${totalSkipped} already there · ${totalUnrouted} unrouted${DRY ? " (DRY)" : ""}\n`);
})();
