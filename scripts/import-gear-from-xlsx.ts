/**
 * Bulk-import every piece of gear from the master xlsx (~209 rows) into
 * Sanity, properly categorized. Idempotent — skips anything that already
 * exists by slug, so Nick can re-run this safely whenever he updates the
 * spreadsheet.
 *
 * Filters out:
 *   · Casings (500-series rack enclosures — not instruments)
 *   · Exact-dupes by (brand + model) — only first occurrence imported
 *   · Rows with no brand AND no model
 *
 * Skipped categories — if mapCategory returns null, we still import the doc
 * with category=outboard as a soft default + a `__needsCategory: true` tag
 * Nick can review in /studio. Wait no — easier: skip those entries so Nick
 * has to fix the source spreadsheet. Logging them so they can be reviewed.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { spawnSync } from "child_process";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const XLSX_PATH =
  "/Users/nickhook/Library/CloudStorage/Dropbox/My Mac (Mac-mini)/Downloads/thespacepit gear list (1).xlsx";

type GearCategory =
  | "drum-machine" | "synth" | "sampler" | "modular" | "sequencer"
  | "outboard" | "pedal" | "mic" | "controller" | "interface"
  | "monitor" | "guitar" | "amp" | "piano" | "dj" | "software";

type XlsxRow = {
  brand: string;
  model: string;
  category: string;
  location: string;
  condition: string;
  notes: string;
};

function readXlsx(): XlsxRow[] {
  const py = `
import json, sys
from openpyxl import load_workbook
wb = load_workbook("${XLSX_PATH}", data_only=True)
ws = wb["thespacepit, NYC"]
out = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0: continue
    cells = list(row) + [None] * 11
    brand = (str(cells[0] or "").strip())
    model = (str(cells[1] or "").strip())
    if not brand and not model: continue
    out.append({
      "brand": brand,
      "model": model,
      "location": (str(cells[2] or "").strip()),
      "condition": (str(cells[3] or "").strip()),
      "notes": (str(cells[4] or "").strip()),
      "category": (str(cells[5] or "").strip()),
    })
sys.stdout.write(json.dumps(out))
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) { console.error(res.stderr); process.exit(1); }
  return JSON.parse(res.stdout);
}

function mapCategory(raw: string, brand: string, model: string): GearCategory | null {
  const c = raw.toLowerCase();
  const name = `${brand} ${model}`.toLowerCase();

  // Hard exclude: casings = rack enclosures, not instruments
  if (/^casing$/.test(c)) return null;

  // Name-based overrides — wins over category string
  if (/sp.?1200/.test(name)) return "sampler";
  if (/cirklon/.test(name)) return "sequencer";
  if (/cdj|djm-|technics 1200|sl-1200|turntable/.test(name)) return "dj";

  // Pedal vs outboard: if it's a Boss/Eventide H9/etc. pedal-format box,
  // pedal wins
  if (/space|boss\b|holy grail|cry baby|rotovibe|distortion pro|tu-2|chromatic tuner/.test(name) && !/re-201/.test(name)) {
    if (/pedal/.test(c)) return "pedal";
  }
  if (/h9 max|h90|space pedal|eventide space/.test(name)) return "pedal";

  // === Category-string cascade ===
  if (/eurorack|modular/.test(c)) return "modular";
  if (/midi.*(interface|port|cv)|midi to cv|soundcard|audio interface|interface/.test(c)) return "interface";
  if (/multitrack recorder|broadcast/.test(c)) return "interface";
  if (/sampler/.test(c)) return "sampler";
  if (/drum machine|drum module/.test(c)) return "drum-machine";
  if (/turntable|^dj$|dj.?mixer|^mixer$/.test(c)) return "dj";
  if (/multi.?fx|pedals?,.*fx|pedal,.*fx|^pedals?\b|stompbox|pedal\b/.test(c)) return "pedal";
  if (/bass guitar/.test(c)) return "guitar";
  if (/^guitar$/.test(c)) return "guitar";
  if (/^amplifier|^amp\b/.test(c) && !/pre.?amp/.test(c)) return "amp";
  if (/piano|electric piano|rhodes|wurli/.test(c)) return "piano";
  if (/midi controller|keyboard, controller|^controller$|keyboard controller/.test(c)) return "controller";
  if (/microphone|^mic\b|lavalier/.test(c)) return "mic";
  if (/speakers?|monitor/.test(c)) return "monitor";
  if (/outboard|fx,?.*outboard|pre.?amp|compressor|^eq\b|outboard,? *eq|reverb|effect processor|vocal fx|fx, |500 series/.test(c)) return "outboard";
  if (/synthesizer.*sequencer|synth.*sequencer/.test(c)) {
    // Has both — pick by name
    if (/cirklon|metropolis|pyramid|hapax/.test(name)) return "sequencer";
    return "synth";
  }
  if (/^sequencer\b/.test(c)) return "sequencer";
  if (/synth|^synthesizer/.test(c)) return "synth";

  return null;
}

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 60);

async function main() {
  const rows = readXlsx();
  console.log(`📒 read ${rows.length} rows from xlsx\n`);

  // Build existing-slug set
  const existing = await sanity.fetch<{ slug: string }[]>(
    `*[_type == "gear" && defined(slug.current)]{ "slug": slug.current }`
  );
  const existingSlugs = new Set(existing.map((x) => x.slug));
  console.log(`📦 ${existingSlugs.size} existing gear docs in Sanity\n`);

  // Dedupe xlsx by (brand+model)
  const seen = new Set<string>();
  let created = 0, skippedExisting = 0, skippedDup = 0, skippedNoCat = 0;

  for (const r of rows) {
    const brand = r.brand.replace(/\s+/g, " ").trim();
    const model = r.model.replace(/\s+/g, " ").trim();
    if (!brand && !model) continue;

    const key = `${brand}|${model}`.toLowerCase();
    if (seen.has(key)) { skippedDup += 1; continue; }
    seen.add(key);

    const cat = mapCategory(r.category, brand, model);
    if (!cat) {
      skippedNoCat += 1;
      if (r.category) console.log(`  ? skip "${brand} ${model}" — couldn't map "${r.category}"`);
      continue;
    }

    // Name = brand + model so the display matches the existing convention
    const name = (brand ? `${brand} ${model}` : model).trim();
    const baseSlug = slugify(name);
    let slug = baseSlug;
    // Stable disambiguation if there's a name collision with something
    // already in Sanity (rare but possible)
    let n = 2;
    while (existingSlugs.has(slug)) {
      // already there — skip, don't double-import
      skippedExisting += 1;
      slug = null as unknown as string;
      break;
    }
    if (!slug) continue;

    const docId = `gear-${baseSlug}`;
    // Map xlsx condition → our status (Brooklyn storage = "shelf" by default
    // unless explicitly marked "Not Working" → "retired")
    let status: "active" | "shelf" | "travel" | "wishlist" | "retired" = "shelf";
    if (/not working/i.test(r.condition)) status = "retired";

    const doc = {
      _id: docId,
      _type: "gear",
      name,
      slug: { _type: "slug", current: baseSlug },
      category: cat,
      status,
      manufacturer: brand || undefined,
      note: r.notes || undefined,
    };

    try {
      await sanity.createIfNotExists(doc as any);
      existingSlugs.add(baseSlug);
      console.log(`  ✓ ${cat.padEnd(13)} ${name}`);
      created += 1;
    } catch (err) {
      console.log(`  ✗ ${name}: ${(err as Error).message}`);
    }
  }

  console.log(
    `\n✅ ${created} new gear docs · ${skippedExisting} already in sanity · ${skippedDup} dupes in xlsx · ${skippedNoCat} couldn't map category`
  );
}
main().catch((err) => { console.error(err); process.exit(1); });
