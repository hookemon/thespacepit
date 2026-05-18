/**
 * Build a 4×4 collage from a curated mix of the SF Drums gallery and set
 * it as `pageBackgroundImage` on CC003 Drums. Page renders bg at ~50%
 * opacity tinted with coverColor, so the photo grid reads as texture
 * rather than competing with the foreground content.
 */
import sharp from "sharp";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, join } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production", apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

const ROOT = "/Users/nickhook/Library/CloudStorage/Dropbox/spiritualFriendship DRUMS LP3/SF drums pics";

// Curate a mix — 8 instrument macros (P4140912…) + 4 session shots (IMG_*)
// + 4 spacePitDrums studio shots. 16 tiles total = 4×4 grid.
const TILES = [
  "P4140912.jpg", "P4140915.jpg", "P4140918.jpg", "P4140922.jpg",
  "P4140913.jpg", "P4140916.jpg", "P4140919.jpg", "P4140924.jpg",
  "IMG_1866.jpg", "IMG_2501.jpg", "IMG_2522.jpg", "IMG_2536.jpg",
  "spacePitDrums/spacePitDrums - 1.jpg", "spacePitDrums/spacePitDrums - 5.jpg",
  "spacePitDrums/spacePitDrums - 9.jpg", "spacePitDrums/spacePitDrums - 13.jpg",
];

(async () => {
  const TILE = 800;     // each tile in the collage
  const COLS = 4;
  const ROWS = 4;
  const W = TILE * COLS;
  const H = TILE * ROWS;

  console.log(`Building ${W}×${H} collage from ${TILES.length} tiles…`);

  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < TILES.length; i++) {
    const path = join(ROOT, TILES[i]);
    const tile = await sharp(path)
      .resize(TILE, TILE, { fit: "cover", position: "center" })
      .toBuffer();
    composites.push({
      input: tile,
      top:  Math.floor(i / COLS) * TILE,
      left: (i % COLS) * TILE,
    });
  }

  // Render as a slightly muted JPG — desaturate a touch + add grain so the
  // 50% overlay reads as a texture, not competing imagery.
  const out = await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 24, g: 24, b: 24 } },
  })
    .composite(composites)
    .modulate({ saturation: 0.55, brightness: 0.85 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  console.log(`Collage built: ${(out.length / 1024 / 1024).toFixed(2)}MB`);

  const asset = await c.assets.upload("image", out, {
    filename: "cc003-drums-collage-bg.jpg",
    contentType: "image/jpeg",
  });
  console.log(`✓ Uploaded asset: ${asset._id}`);

  await c.patch("release-cc003-drums").set({
    pageBackgroundImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
  }).commit();
  console.log("✓ Set as pageBackgroundImage on CC003 Drums");
})().catch((e) => { console.error(e); process.exit(1); });
