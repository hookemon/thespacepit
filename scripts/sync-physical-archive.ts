/**
 * Sync the physical-archive Dropbox folder → Sanity.
 *
 * Source of truth: `~/Library/CloudStorage/Dropbox/physical-archive/<slug>/`
 *
 * Each subfolder = a release slug. Each image file inside is matched to
 * an artifact kind by filename prefix and uploaded to that release's
 * `physicalArtifacts[]` (or `linerNotes[]` for `liner-*` files), so it
 * renders in the "THE PHYSICAL" room on /releases/<slug>.
 *
 * Idempotent: each upload tags the file by its source path. Re-runs
 * skip files already present (matched by basename).
 *
 * Usage:
 *   npx tsx scripts/sync-physical-archive.ts            (all release folders)
 *   npx tsx scripts/sync-physical-archive.ts --dry-run  (preview only)
 *   npx tsx scripts/sync-physical-archive.ts --only=cc015-relationships
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readdirSync, readFileSync, statSync } from "fs";
import { resolve, join, basename, extname } from "path";
import { homedir } from "os";

config({ path: resolve(process.cwd(), ".env.local") });

const ROOT = join(homedir(), "Library/CloudStorage/Dropbox/physical-archive");

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// Filename prefix → physicalArtifact.kind. Order matters: longest match wins.
const KIND_MAP: { prefix: string; kind: string; title?: string }[] = [
  { prefix: "test-press",  kind: "test-pressing", title: "test pressing" },
  { prefix: "test-pressing", kind: "test-pressing", title: "test pressing" },
  { prefix: "j-card",      kind: "j-card",        title: "J-card" },
  { prefix: "jcard",       kind: "j-card",        title: "J-card" },
  { prefix: "inner-sleeve", kind: "inner-sleeve", title: "inner sleeve" },
  { prefix: "inner",       kind: "inner-sleeve",  title: "inner sleeve" },
  { prefix: "insert",      kind: "insert",        title: "insert" },
  { prefix: "lyric",       kind: "lyric-sheet",   title: "lyric sheet" },
  { prefix: "plaque",      kind: "plaque",        title: "RIAA plaque" },
  { prefix: "cover-front", kind: "jacket",        title: "front cover" },
  { prefix: "cover-back",  kind: "jacket",        title: "back cover" },
  { prefix: "cover",       kind: "jacket",        title: "jacket" },
  { prefix: "jacket",      kind: "jacket",        title: "jacket" },
  { prefix: "back",        kind: "jacket",        title: "back cover" },
  { prefix: "front",       kind: "jacket",        title: "front cover" },
];

function classify(filename: string): { kind: string; title: string } | null {
  const lower = filename.toLowerCase();
  for (const m of KIND_MAP) {
    if (lower.startsWith(m.prefix)) {
      return { kind: m.kind, title: m.title ?? m.kind.replace(/-/g, " ") };
    }
  }
  // Default for anything unclassified — still uploads, just as a generic artifact.
  return { kind: "artifact", title: filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") };
}

function isLinerNote(filename: string): boolean {
  return /^liner[-_]/i.test(filename);
}

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".heic"]);

type FoundFile = { absPath: string; name: string };

function listImages(dir: string): FoundFile[] {
  try {
    return readdirSync(dir)
      .filter((f) => IMG_EXTS.has(extname(f).toLowerCase()))
      .filter((f) => !f.startsWith("."))
      .map((f) => ({ absPath: join(dir, f), name: f }));
  } catch {
    return [];
  }
}

async function syncRelease(slug: string, dryRun: boolean) {
  const dir = join(ROOT, slug);
  if (!statSync(dir).isDirectory()) return;

  const files = listImages(dir);
  if (files.length === 0) {
    console.log(`  (no images in ${slug})`);
    return;
  }

  const release = await c.fetch<{ _id: string; physicalArtifacts?: { title?: string }[]; linerNotes?: { caption?: string }[] } | null>(
    `*[_type=="release" && slug.current==$slug][0]{ _id, physicalArtifacts, linerNotes }`,
    { slug },
  );
  if (!release) {
    console.warn(`  ⚠ no release doc for slug "${slug}" — skipping`);
    return;
  }

  // Build sets of titles already present, so re-runs skip dupes.
  const existingArtifactTitles = new Set(
    (release.physicalArtifacts ?? []).map((a) => (a.title ?? "").toLowerCase()),
  );
  const existingLinerCaptions = new Set(
    (release.linerNotes ?? []).map((l) => (l.caption ?? "").toLowerCase()),
  );

  const newArtifacts: unknown[] = [];
  const newLiners: unknown[] = [];

  for (const f of files) {
    const isLiner = isLinerNote(f.name);
    const titleHint = isLiner
      ? f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
      : (classify(f.name)?.title ?? f.name);
    const tagKey = titleHint.toLowerCase();

    if (isLiner ? existingLinerCaptions.has(tagKey) : existingArtifactTitles.has(tagKey)) {
      console.log(`  · skip (already on doc): ${f.name}`);
      continue;
    }

    if (dryRun) {
      console.log(`  + would upload ${isLiner ? "[liner]" : "[artifact]"} ${f.name} → "${titleHint}"`);
      continue;
    }

    const buf = readFileSync(f.absPath);
    const asset = await c.assets.upload("image", buf, { filename: f.name });
    const key = `phys-${Math.random().toString(36).slice(2, 10)}`;

    if (isLiner) {
      newLiners.push({
        _key: key,
        image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
        caption: titleHint,
      });
      console.log(`  ✓ liner: ${f.name}`);
    } else {
      const cls = classify(f.name)!;
      newArtifacts.push({
        _key: key,
        image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
        kind: cls.kind,
        title: cls.title,
      });
      console.log(`  ✓ artifact (${cls.kind}): ${f.name}`);
    }
  }

  if (dryRun) return;
  if (newArtifacts.length === 0 && newLiners.length === 0) return;

  // Append to existing arrays (preserve what's already there).
  const patch = c.patch(release._id);
  if (newArtifacts.length > 0) patch.setIfMissing({ physicalArtifacts: [] }).append("physicalArtifacts", newArtifacts);
  if (newLiners.length > 0) patch.setIfMissing({ linerNotes: [] }).append("linerNotes", newLiners);
  await patch.commit();
  console.log(`  → patched ${slug} (+${newArtifacts.length} artifacts, +${newLiners.length} liners)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.replace("--only=", "") : null;

  let subdirs: string[];
  try {
    subdirs = readdirSync(ROOT).filter((d) => {
      try {
        return statSync(join(ROOT, d)).isDirectory() && !d.startsWith(".");
      } catch {
        return false;
      }
    });
  } catch {
    console.error(`✗ physical-archive folder not found at ${ROOT}`);
    process.exit(1);
  }

  if (only) subdirs = subdirs.filter((s) => s === only);

  if (subdirs.length === 0) {
    console.log("(no release folders yet — drop scans in subfolders named after release slugs)");
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}syncing ${subdirs.length} release folder(s)…`);
  for (const slug of subdirs) {
    console.log(`\n[${slug}]`);
    await syncRelease(slug, dryRun);
  }
  console.log("\n✓ done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
