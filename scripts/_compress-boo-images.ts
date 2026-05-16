/* eslint-disable no-console */
/**
 * One-off: compress the BOO vault images in /public/boo so they're
 * web-friendly. Targets ~1200px longest edge + JPEG q80 (PNG for the
 * ones that need transparency).
 */
import sharp from "sharp";
import { readdir, stat, rename } from "node:fs/promises";
import { resolve, join } from "node:path";

const DIR = resolve("public/boo");
const MAX_EDGE = 1400;

// Files that need transparency preserved (logos).
const KEEP_PNG = /logo/i;

async function main() {
  const files = await readdir(DIR);
  for (const f of files) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue;
    const path = join(DIR, f);
    const before = (await stat(path)).size;
    if (before < 600 * 1024) {
      // Already small enough.
      console.log(`  ↳ skip (${(before / 1024).toFixed(0)} KB): ${f}`);
      continue;
    }
    const tmp = path + ".tmp";
    const isLogo = KEEP_PNG.test(f);
    let pipe = sharp(path).resize(MAX_EDGE, MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    });
    if (isLogo) {
      await pipe.png({ compressionLevel: 9 }).toFile(tmp);
    } else {
      await pipe.jpeg({ quality: 82, mozjpeg: true }).toFile(tmp);
    }
    const after = (await stat(tmp)).size;
    await rename(tmp, path);
    console.log(
      `  ✓ ${f}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (-${Math.round((1 - after / before) * 100)}%)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
