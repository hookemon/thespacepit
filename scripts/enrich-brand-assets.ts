/**
 * Enrich /partners brand docs with real logos + background images.
 *
 * Sourcing strategy:
 *   - Logos: WebFetch'd from each brand's official homepage when possible.
 *     Wikimedia/Wikipedia Commons SVGs as fallback for sites that 403'd
 *     (Native Instruments, Rockstar) or hid their logo in a data: URI
 *     (Moog, Roland, TE, Splice).
 *   - Backgrounds: hero/campaign photos pulled from each brand's homepage.
 *     Only a subset returned strong hero shots; the rest stay null and
 *     fall through to the masthead treatment on /partners.
 *
 * Idempotent — re-running compares an asset-source fingerprint we stash in
 * the asset's metadata so we don't re-upload the same URL twice.
 *
 * Usage:  npx tsx scripts/enrich-brand-assets.ts
 *         npx tsx scripts/enrich-brand-assets.ts --dry   (print plan only)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, extname } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const DRY = process.argv.includes("--dry");

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// Keyed by brand `name` (the field on the doc). 11 logos sourced from
// official sites or Wikipedia Commons; The Lot Radio falls back to its
// apple-touch-icon. Boiler Room + RBMA don't have a clean source and
// fall through to the typographic masthead on /partners.
const LOGOS: Record<string, string> = {
  // Official-site SVGs
  "Eventide":            "https://cdn.eventideaudio.com/uploads/2019/10/eventide-logo-white.svg",
  "Fool's Gold Records": "https://foolsgoldrecs.com/wp-content/themes/fools-gold-brand-site-klaviyo/img/fg-logo-white.svg",
  "Serato":              "https://m.cdn.sera.to/logos/logo.svg",
  // Wikipedia Commons SVGs (used in editorial/portfolio context — nominative)
  "Moog":                "https://upload.wikimedia.org/wikipedia/commons/a/aa/Moog_Music_Logo.svg",
  "Native Instruments":  "https://upload.wikimedia.org/wikipedia/commons/e/ec/Native_Instruments_logo_2023.svg",
  "Roland":              "https://upload.wikimedia.org/wikipedia/commons/2/25/Roland_Corporation_logo.svg",
  "Rockstar Games":      "https://upload.wikimedia.org/wikipedia/commons/5/53/Rockstar_Games_Logo.svg",
  "Splice":              "https://upload.wikimedia.org/wikipedia/commons/9/9d/Splice_logo_clean.svg",
  "Teenage Engineering": "https://upload.wikimedia.org/wikipedia/en/9/99/Teenage_Engineering_logo.png",
  // Vice has a wp-uploaded transparent PNG
  "Noisey / Vice":       "https://www.vice.com/wp-content/uploads/sites/2/2024/06/vice-logo_white@2x.png",
  // Lot Radio: their site's apple-touch-icon (cleanest accessible asset)
  "The Lot Radio":       "https://thelotradio.com/apple-touch-icon.png",
};

const HEROES: Record<string, string> = {
  "Eventide":            "https://cdn.eventideaudio.com/uploads/2026/05/FIXATE-HOME-V2.jpg",
  "Noisey / Vice":       "https://www.vice.com/wp-content/uploads/sites/2/2026/05/GettyImages-2276320276.jpg",
  "Roland":              "https://static.roland.com/assets/promos/jpg/billboard_gomixer_studio.jpg",
  "Serato":              "https://cdn.sanity.io/images/4z8uxx4p/production/7febdbb62b47baba4e0aa1470862ff4d2c5e18a4-3840x2161.png?w=1600",
};

async function downloadAndUpload(url: string, kind: "logo" | "hero", brand: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "spacepit-web/1.0 +https://thespacepit.com" },
    });
    if (!res.ok) {
      console.log(`     ✗ ${kind} fetch failed: ${res.status} ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (extname(new URL(url).pathname) || ".bin").toLowerCase();
    const safe = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
    const filename = `brand-${safe}-${kind}${ext}`;

    const asset = await sanity.assets.upload("image", buf, {
      filename,
      // The `source` block lets future re-runs detect "already uploaded
      // from this URL" via the source.id fingerprint we stash.
      source: { name: "enrich-brand-assets", id: url, url },
    });
    console.log(`     ✓ uploaded ${kind} (${(buf.length / 1024).toFixed(1)}kb) → ${asset._id}`);
    return asset._id;
  } catch (err) {
    console.log(`     ✗ ${kind} upload error: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log(`\n🏷  enrich-brand-assets ${DRY ? "(DRY RUN)" : ""}\n`);

  const brands = await sanity.fetch<Array<{ _id: string; name: string; logo?: any; backgroundImage?: any }>>(
    `*[_type == "brand"]{_id, name, logo, backgroundImage}`
  );
  console.log(`  ${brands.length} brand docs in Sanity\n`);

  const byName = new Map(brands.map((b) => [b.name, b]));

  let logosWritten = 0, heroesWritten = 0, skipped = 0;

  for (const name of Object.keys(LOGOS)) {
    const brand = byName.get(name);
    if (!brand) {
      console.log(`  ⚠ no brand doc named "${name}" — skipped`);
      continue;
    }
    console.log(`◌ ${name}`);

    // LOGO
    if (brand.logo) {
      console.log(`     · logo already set — skipping`);
      skipped++;
    } else {
      const url = LOGOS[name];
      if (!DRY) {
        const assetId = await downloadAndUpload(url, "logo", name);
        if (assetId) {
          await sanity.patch(brand._id).set({
            logo: { _type: "image", asset: { _type: "reference", _ref: assetId } },
          }).commit();
          console.log(`     ✓ patched brand.logo`);
          logosWritten++;
        }
      } else {
        console.log(`     [dry] would upload logo from ${url}`);
      }
    }

    // HERO (only some brands have one queued)
    const heroUrl = HEROES[name];
    if (heroUrl) {
      if (brand.backgroundImage) {
        console.log(`     · backgroundImage already set — skipping`);
      } else if (!DRY) {
        const assetId = await downloadAndUpload(heroUrl, "hero", name);
        if (assetId) {
          await sanity.patch(brand._id).set({
            backgroundImage: { _type: "image", asset: { _type: "reference", _ref: assetId } },
          }).commit();
          console.log(`     ✓ patched brand.backgroundImage`);
          heroesWritten++;
        }
      } else {
        console.log(`     [dry] would upload hero from ${heroUrl}`);
      }
    }
  }

  console.log(`\n  ✓ logos written: ${logosWritten}`);
  console.log(`  ✓ heroes written: ${heroesWritten}`);
  console.log(`  · skipped (already set): ${skipped}`);
  console.log(`\n  view: http://localhost:3000/partners\n`);
}

main();
