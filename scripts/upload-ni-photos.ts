/**
 * Pull every photo from the Native Instruments Komplete 26 Dropbox folder,
 * upload to Sanity, attach to the right destination:
 *
 *  · STILLS  → La Burbuja LP gallery (the pro shoot at la burbuja)
 *  · Candids → thespacepit studio gallery (spacepit graffiti walls, sessions)
 *
 * Idempotent — if a file has already been uploaded (matched by filename), it
 * won't re-upload. Re-running just attaches any new files.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve as resolvePath, join, basename } from "path";

config({ path: resolvePath(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/Nick Hook x Native Instruments Komplete 26";
const IMG_RE = /\.(jpe?g|png)$/i;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (IMG_RE.test(name)) out.push(full);
  }
  return out;
}

type Asset = { _id: string; originalFilename?: string };

async function uploadOrFind(filePath: string): Promise<string> {
  const filename = basename(filePath);
  // See if we've uploaded this already.
  const existing = await client.fetch<Asset | null>(
    `*[_type == "sanity.imageAsset" && originalFilename == $fn][0]{ _id, originalFilename }`,
    { fn: filename }
  );
  if (existing?._id) return existing._id;

  const buf = readFileSync(filePath);
  const asset = await client.assets.upload("image", buf, { filename });
  return asset._id;
}

async function appendToGallery(docId: string, assetIds: string[]) {
  const refs = assetIds.map((aid, i) => ({
    _key: `g-${docId.slice(-6)}-${Date.now()}-${i}`,
    _type: "image",
    asset: { _type: "reference", _ref: aid },
  }));
  const doc = await client.fetch<{ gallery?: unknown[] } | null>(
    `*[_id == $id][0]{ gallery }`,
    { id: docId }
  );
  // Filter out asset IDs that are already in the gallery (idempotent).
  const existingRefs = new Set<string>();
  for (const g of (doc?.gallery ?? []) as { asset?: { _ref?: string } }[]) {
    if (g.asset?._ref) existingRefs.add(g.asset._ref);
  }
  const toAdd = refs.filter((r) => !existingRefs.has(r.asset._ref));
  if (toAdd.length === 0) return 0;
  await client
    .patch(docId)
    .setIfMissing({ gallery: [] })
    .append("gallery", toAdd)
    .commit({ autoGenerateArrayKeys: true });
  return toAdd.length;
}

async function findDoc(query: string): Promise<string | null> {
  const r = await client.fetch<{ _id: string } | null>(query);
  return r?._id ?? null;
}

async function main() {
  const all = walk(ROOT);
  console.log(`📷 found ${all.length} photos\n`);

  // Group by subfolder.
  const stills = all.filter((p) => p.includes("/STILLS/"));
  const candids = all.filter((p) => p.includes("/Candids/"));
  console.log(`  STILLS:  ${stills.length}`);
  console.log(`  Candids: ${candids.length}\n`);

  // Resolve destination docs.
  const burbujaReleaseId = await findDoc(`*[_type == "release" && slug.current == "cc025-la-burbuja-lp"][0]{ _id }`);
  const thespacepitStudioId = await findDoc(`*[_type == "studio" && slug.current == "thespacepit"][0]{ _id }`);
  const laburbujaStudioId = await findDoc(`*[_type == "studio" && slug.current == "la-burbuja"][0]{ _id }`);
  if (!burbujaReleaseId) console.warn("⚠ La Burbuja LP release not found");
  if (!thespacepitStudioId) console.warn("⚠ thespacepit studio not found");
  if (!laburbujaStudioId) console.warn("⚠ la burbuja studio not found");

  // Upload everything once. Track asset IDs by source.
  const stillsAssets: string[] = [];
  const candidsAssets: string[] = [];

  console.log("Uploading STILLS:");
  for (const p of stills) {
    const aid = await uploadOrFind(p);
    stillsAssets.push(aid);
    process.stdout.write(`  ✓ ${basename(p)}\n`);
  }

  console.log("\nUploading Candids:");
  for (const p of candids) {
    const aid = await uploadOrFind(p);
    candidsAssets.push(aid);
    process.stdout.write(`  ✓ ${basename(p)}\n`);
  }

  // Attach.
  console.log("\nAttaching to galleries:");
  if (burbujaReleaseId) {
    const n = await appendToGallery(burbujaReleaseId, stillsAssets);
    console.log(`  + ${n} STILLS → La Burbuja LP gallery`);
  }
  if (laburbujaStudioId) {
    const n = await appendToGallery(laburbujaStudioId, stillsAssets);
    console.log(`  + ${n} STILLS → la burbuja studio gallery`);
  }
  if (thespacepitStudioId) {
    const n = await appendToGallery(thespacepitStudioId, candidsAssets);
    console.log(`  + ${n} Candids → thespacepit studio gallery`);
  }

  console.log("\n✅ done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
