/* eslint-disable no-console */
// One-off: inspect CC FILL WHITE.png to confirm whether it's filled or outlined.
import sharp from "sharp";

async function main() {
  const src =
    "/Users/nickhook/Library/CloudStorage/Dropbox/C + C/untitled folder/CC QUICK ACCESS/CC FILL WHITE.png";
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let opaque = 0,
    transparent = 0,
    white = 0,
    black = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      a = data[i + 3];
    if (a < 20) transparent++;
    else {
      opaque++;
      if (r > 240 && g > 240 && b > 240) white++;
      else if (r < 20 && g < 20 && b < 20) black++;
    }
  }
  console.log({
    width,
    height,
    channels,
    total: width * height,
    transparent,
    opaque,
    white,
    black,
    pctOpaque: ((opaque / (width * height)) * 100).toFixed(1) + "%",
  });
  const cx = Math.floor(width / 2),
    cy = Math.floor(height / 2);
  const idx = (cy * width + cx) * channels;
  console.log("center pixel rgba:", data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
  const samples: [number, number][] = [
    [cx, 10],
    [cx, height - 10],
    [10, cy],
    [width - 10, cy],
    [cx, Math.floor(height * 0.25)],
    [Math.floor(width * 0.25), cy],
    [Math.floor(width * 0.75), cy],
  ];
  for (const [x, y] of samples) {
    const i = (y * width + x) * channels;
    console.log("at", x, y, ":", data[i], data[i + 1], data[i + 2], data[i + 3]);
  }
}

main();
