/**
 * Upload all 51 photos from `spiritualFriendship DRUMS LP3/SF drums pics`
 * (incl. drumMachinePics + spacePitDrums subfolders) as a gallery on
 * CC003 Drums.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, join, basename } from "path";
import { readdir, stat, readFile } from "fs/promises";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/spiritualFriendship DRUMS LP3/SF drums pics";

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const name of await readdir(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...await walk(full));
    else if (/\.(jpg|jpeg|png)$/i.test(name)) out.push(full);
  }
  return out;
}

(async () => {
  const files = (await walk(ROOT)).sort();
  console.log(`Found ${files.length} photos. Uploading...`);
  const gallery: Array<{ _key: string; _type: "image"; asset: { _type: "reference"; _ref: string } }> = [];
  for (const [i, path] of files.entries()) {
    const buf = await readFile(path);
    const fn = basename(path).replace(/\s+/g, "-").toLowerCase();
    const asset = await c.assets.upload("image", buf, {
      filename: `cc003-drums-${fn}`, contentType: path.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
    });
    gallery.push({ _key: randomUUID(), _type: "image", asset: { _type: "reference", _ref: asset._id } });
    process.stdout.write(`\r  uploaded ${i + 1}/${files.length}: ${basename(path).slice(0, 36).padEnd(36, " ")}`);
  }
  console.log();
  await c.patch("release-cc003-drums").set({ gallery }).commit();
  console.log(`✓ Gallery patched with ${gallery.length} photos`);
})().catch((err) => { console.error(err); process.exit(1); });
