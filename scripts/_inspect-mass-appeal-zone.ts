/* eslint-disable no-console */
// One-off: find the bounding box of the Mass Appeal logo in the source jpg
// by scanning for yellow pixels in the bottom-right quadrant.
import sharp from "sharp";

async function main() {
  const src =
    "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Calm + Collect Remix Compilation/MUSIC/OLD ENGLISH/OLD ENGLISH COVER.jpg";
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Bottle ends around x = 75%. Mass Appeal is to the right of it.
  const x0 = Math.floor(width * 0.78);
  const y0 = Math.floor(height * 0.85);

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0,
    count = 0;
  for (let y = y0; y < height; y++) {
    for (let x = x0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      // Yellow pixel test (same as the cover recolor).
      if (r > 200 && g > 170 && b < 90 && r > b + 100) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }
  console.log(`source: ${width}x${height}`);
  console.log(`mass appeal bbox: x ${minX}-${maxX} (${maxX - minX}px), y ${minY}-${maxY} (${maxY - minY}px)`);
  console.log(`as fractions: x ${(minX / width).toFixed(3)}-${(maxX / width).toFixed(3)}, y ${(minY / height).toFixed(3)}-${(maxY / height).toFixed(3)}`);
  console.log(`pixel count: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
