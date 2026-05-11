/**
 * Upload a cover image from a local file path → Sanity → attach to a release.
 *
 * Use it for any release where you've got the cover sitting on disk:
 *   npx tsx scripts/upload-release-cover.ts \
 *     --slug=cc005-need-for-speed \
 *     --file=~/Downloads/need-for-speed-cover.png
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve as resolvePath, basename } from "path";
import { homedir } from "os";

config({ path: resolvePath(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

function expand(p: string): string {
  if (p.startsWith("~/")) return resolvePath(homedir(), p.slice(2));
  return resolvePath(p);
}

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith("--slug="));
  const fileArg = args.find((a) => a.startsWith("--file="));
  if (!slugArg || !fileArg) {
    console.error("Usage: --slug=<release-slug> --file=<path-to-image>");
    process.exit(1);
  }
  const slug = slugArg.replace("--slug=", "");
  const filePath = expand(fileArg.replace("--file=", ""));

  // Find the release.
  const release = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "release" && slug.current == $slug][0]{ _id, title }`,
    { slug }
  );
  if (!release) {
    console.error(`No release with slug "${slug}".`);
    process.exit(1);
  }

  // Read + upload the asset.
  const buf = readFileSync(filePath);
  const filename = basename(filePath);
  console.log(`📤 uploading ${filename} (${(buf.length / 1024).toFixed(1)}kb)...`);
  const asset = await client.assets.upload("image", buf, { filename });

  // Attach as the cover.
  await client.patch(release._id).set({
    cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
  }).commit();

  console.log(`✓ attached to ${release.title}`);
  console.log(`  see it: /releases/${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
