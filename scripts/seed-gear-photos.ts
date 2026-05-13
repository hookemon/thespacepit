/**
 * Backfill gear photos from Wikipedia. Same strict-match pattern as the
 * artist photo scraper, but the validation looks for INSTRUMENT-related
 * terms (synthesizer, drum machine, sampler, pedal, effects unit, etc.)
 * instead of music-person terms.
 *
 * Works best on legendary / iconic gear that has Wikipedia coverage:
 * Roland TR-808, MPC60, SP-1200, Juno-106, Moog Voyager, Eventide H3000,
 * Neve 1073, etc. Less reliable for boutique modular or one-off devices.
 *
 * Skipped: already has photo (unless --force), placeholder names.
 *
 * Run:
 *   npx tsx scripts/seed-gear-photos.ts
 *   npx tsx scripts/seed-gear-photos.ts --slug roland-tr-808
 *   npx tsx scripts/seed-gear-photos.ts --force
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const UA = "spacepit-web/1.0 (https://thespacepit.com) gear-photo-scraper";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const FORCE     = process.argv.includes("--force");
const ONLY_SLUG = arg("slug");

const INSTRUMENT_TERMS = [
  "synthesizer", "synth ", "drum machine", "sampler", "sequencer",
  "audio interface", "microphone", "mic ", "amplifier", "guitar",
  "bass guitar", "piano", "keyboard", "effect pedal", "effects unit",
  "compressor", "equalizer", "reverb unit", "delay pedal", "harmonizer",
  "vocoder", "synth module", "rack mount", "module", "tape echo",
  "groovebox", "workstation", "drum kit", "turntable", "mixer",
  "audio processor", "MIDI controller", "analog ", "digital signal",
  "modular synth", "eurorack", "instrument", "musical instrument",
];

type WikiSummary = {
  type?: string;
  title: string;
  description?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
};

async function tryWiki(title: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    const d = (await res.json()) as WikiSummary;
    if (d.type === "disambiguation") return null;
    return d;
  } catch {
    return null;
  }
}

function isInstrumentRelated(extract = "", description = ""): boolean {
  const hay = `${extract}\n${description}`.toLowerCase();
  return INSTRUMENT_TERMS.some((t) => hay.includes(t.toLowerCase()));
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) return null;
    const asset = await sanity.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

type Gear = { _id: string; name: string; slug: string; manufacturer?: string; hasPhoto: boolean };

async function main() {
  const rows = await sanity.fetch<Gear[]>(`
    *[_type == "gear"]{
      _id, name, "slug": slug.current, manufacturer,
      "hasPhoto": defined(photo)
    } | order(pinned desc, name asc)
  `);

  let pool = rows;
  if (ONLY_SLUG) pool = pool.filter((g) => g.slug === ONLY_SLUG);
  else if (!FORCE) pool = pool.filter((g) => !g.hasPhoto);

  console.log(`📸 ${pool.length} gear items missing a photo\n`);

  let wrote = 0, noImage = 0, noMatch = 0;
  for (const g of pool) {
    const label = ` ${g.name.padEnd(46)}`;
    process.stdout.write(`${label} `);

    // Try several Wikipedia title variants — manufacturer is in name already
    // for most gear, so direct lookup usually works. Also try without dashes.
    const variants = [
      g.name,
      g.name.replace(/^TE /, "Teenage Engineering "),
      g.name.replace(/-/g, " "),
      g.manufacturer && !g.name.toLowerCase().includes(g.manufacturer.toLowerCase())
        ? `${g.manufacturer} ${g.name}`
        : null,
    ].filter((x): x is string => !!x);

    let hit: WikiSummary | null = null;
    for (const v of variants) {
      const s = await tryWiki(v);
      if (s?.extract && isInstrumentRelated(s.extract, s.description)) {
        hit = s;
        break;
      }
      await new Promise((r) => setTimeout(r, 80));
    }

    if (!hit) {
      console.log("✗ no wiki match");
      noMatch += 1;
      continue;
    }

    const src = hit.originalimage?.source ?? hit.thumbnail?.source;
    if (!src) {
      console.log(`✗ "${hit.title}" no image`);
      noImage += 1;
      continue;
    }

    const ext = src.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      console.log(`✗ skip ${ext}`);
      noImage += 1;
      continue;
    }

    const assetId = await uploadFromUrl(src, `${g.slug}.${ext}`);
    if (!assetId) {
      console.log("✗ upload failed");
      noImage += 1;
      continue;
    }

    await sanity.patch(g._id).set({
      photo: { _type: "image", asset: { _type: "reference", _ref: assetId } },
    }).commit();

    console.log(`✓ "${hit.title}"  ${hit.originalimage?.width ?? hit.thumbnail?.width}px`);
    wrote += 1;

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n✅ ${wrote} photos written · ${noImage} no image · ${noMatch} no wiki match`);
}
main().catch((err) => { console.error(err); process.exit(1); });
