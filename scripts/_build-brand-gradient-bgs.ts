/**
 * Per-brand gradient background — each partner card gets its own color
 * identity instead of the flat dark wall. Diagonal sweep from a known brand
 * color into a deep contrast, with a soft vignette so the logo (rendered
 * over top by the page) reads cleanly.
 *
 * Renders 2000×1500 JPGs (covers the detail-page hero AND the index card
 * crop at 1200×900).
 */
import sharp from "sharp";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production", apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

// Brand colors — c1 is the SATURATED brand color (dominates the center
// where the logo lands), c2 is a DARKER TONAL VARIANT (about 50-60%
// lightness of c1) for the corners. Tonal sweep, not desaturation —
// keeps the brand color identity strong across the whole card.
const BRAND_GRADIENTS: Record<string, { c1: string; c2: string }> = {
  "ableton":                { c1: "#E5DCC0", c2: "#9E9670" },  // warm cream → tan
  "boiler-room":            { c1: "#E50914", c2: "#5C0309" },
  "eventide":               { c1: "#1E5BB8", c2: "#0B2B5E" },
  "fools-gold-records":     { c1: "#E8B800", c2: "#6B5200" },
  "moog":                   { c1: "#FF6E2C", c2: "#7A2E0A" },
  "native-instruments":     { c1: "#2F58C9", c2: "#0F1F47" },
  "noisey-vice":            { c1: "#E83A1C", c2: "#6E1C0B" },
  "red-bull-music-academy": { c1: "#FF1F00", c2: "#5C0500" },
  "rockstar-games":         { c1: "#FFB200", c2: "#7A4F00" },
  "roland":                 { c1: "#D71920", c2: "#5C0B0D" },
  "serato":                 { c1: "#E22E27", c2: "#6B130F" },
  "splice":                 { c1: "#7B3FE4", c2: "#3E1B7A" },
  "teenage-engineering":    { c1: "#FF7A1C", c2: "#B34700" },
  "the-lot-radio":          { c1: "#0078D4", c2: "#003666" },
};

function gradientSvg(c1: string, c2: string): string {
  // Saturated brand color dominates the center (where the logo lands),
  // with a soft tonal sweep into a darker version at the corners.
  // c1 = main brand color (center), c2 = darker/deeper variant (edges).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1500" viewBox="0 0 2000 1500">
    <defs>
      <radialGradient id="ring" cx="50%" cy="50%" r="80%">
        <stop offset="0%"  stop-color="${c1}"/>
        <stop offset="60%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </radialGradient>
    </defs>
    <rect width="2000" height="1500" fill="url(#ring)"/>
  </svg>`;
}

(async () => {
  for (const [slug, { c1, c2 }] of Object.entries(BRAND_GRADIENTS)) {
    const brand: any = await c.fetch(
      `*[_type == "brand" && slug.current == $slug][0]{ _id, "hasBg": defined(backgroundImage.asset) }`,
      { slug },
    );
    if (!brand) { console.log(`✗ ${slug}: no brand doc`); continue; }
    // overwrite mode — always regen so design iterations actually take effect
    const svg = gradientSvg(c1, c2);
    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    const asset = await c.assets.upload("image", buf, {
      filename: `${slug}-bg.jpg`, contentType: "image/jpeg",
    });
    await c.patch(brand._id).set({
      backgroundImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    }).commit();
    console.log(`✓ ${slug}: ${c1} → ${c2}`);
    await new Promise((r) => setTimeout(r, 250));
  }
})().catch((err) => { console.error(err); process.exit(1); });
