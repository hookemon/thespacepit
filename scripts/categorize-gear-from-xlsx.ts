/**
 * Pulls categories from the master gear spreadsheet (column F: Category) and
 * applies them to every existing Sanity gear doc by fuzzy-matching on
 * (brand + model).
 *
 * The xlsx has free-form category strings like "Pedal, Guitar, FX" or
 * "Outboard, 500 Series" — we normalize them into our 16-key enum.
 *
 * Run after expanding the GearCategory enum in app/_lib/gear-data.ts and the
 * Sanity schema; this script will assume those keys exist.
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

type XlsxRow = { brand: string; model: string; category: string };

// Read the xlsx via a tiny python helper — emits one JSON line per row.
function readXlsx(): XlsxRow[] {
  const py = `
import json, sys
from openpyxl import load_workbook
wb = load_workbook("${XLSX_PATH}", data_only=True)
ws = wb["thespacepit, NYC"]
out = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0: continue
    brand, model, _, _, _, category, *rest = list(row) + [None] * 11
    brand = (str(brand).strip() if brand else "")
    model = (str(model).strip() if model else "")
    category = (str(category).strip() if category else "")
    if not brand and not model: continue
    out.append({"brand": brand, "model": model, "category": category})
sys.stdout.write(json.dumps(out))
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) {
    console.error("python failed:", res.stderr);
    process.exit(1);
  }
  return JSON.parse(res.stdout);
}

/**
 * Map a free-form xlsx category string → our enum.
 * Priority order matters: more specific patterns first. Multi-token strings
 * (e.g. "Drum Machine, Sampler") fall through to the FIRST matching rule, so
 * we treat ambiguous pieces by their dominant identity.
 */
function mapCategory(raw: string, brand: string, model: string): GearCategory | null {
  const c = raw.toLowerCase();
  const name = `${brand} ${model}`.toLowerCase();

  // Specific overrides by name FIRST — wins over the raw category string.
  // (SP-1200 is the canonical "drum machine that's actually a sampler" — we
  // already moved it; keep parity here.)
  if (/sp.?1200|mpc/.test(name) && !/element/.test(name)) return "sampler";

  // 500-series gear: housing + modules — always "outboard"
  if (/\b500\b.*series|lunchbox|api 500/.test(c)) return "outboard";

  // === Rule cascade — order matters
  if (/casing/.test(c)) return "outboard";                 // 500-series racks
  if (/eurorack|modular/.test(c)) return "modular";
  if (/sampler/.test(c)) return "sampler";
  if (/drum machine|drum module|rhythm/.test(c)) return "drum-machine";
  if (/^sequencer|^synthesizer \+ sequencer|synth.*sequencer/.test(c)) {
    // Standalone sequencers, not synth-with-seq
    if (/cirklon|metropolis|pyramid|squarp|hapax/.test(name)) return "sequencer";
  }
  if (/turntable|cdj|dj.?mixer|^dj/.test(c) || /1200|cdj|djm-/.test(name)) return "dj";
  if (/multi.?fx|pedals?,.*fx|pedal,.*fx|^pedals?\b|stompbox/.test(c)) return "pedal";
  if (/bass guitar|^guitar\b|^bass\b/.test(c)) return "guitar";
  if (/amplifier|^amp\b/.test(c) && !/pre.?amp/.test(c)) return "amp";
  if (/piano|workstation.*piano|electric piano|rhodes|wurli/.test(c)) return "piano";
  if (/midi controller|keyboard, controller|^controller$/.test(c)) return "controller";
  if (/microphone|^mic$/.test(c)) return "mic";
  if (/speakers?|monitor/.test(c)) return "monitor";
  if (/midi.*(interface|port|cv)|soundcard|audio interface|interface/.test(c)) return "interface";
  if (/outboard|fx,?.*outboard|pre.?amp|compressor|eq|reverb|effect processor|vocal fx|fx, /.test(c)) return "outboard";
  if (/^synth(esizer)?/.test(c)) return "synth";
  if (/mixer/.test(c)) return "dj"; // small mixers usually dj-adjacent in his rack
  if (/broadcast|multitrack recorder/.test(c)) return "interface";

  // Last-resort heuristics from name
  if (/mpc|sp.?1200|sp.?404|s950|s612|akai s/.test(name)) return "sampler";
  if (/tr-?\d{3}|808|909|707|rhythm/.test(name)) return "drum-machine";
  if (/sm7|u87|u47|sennheiser|shure|akg|neumann/.test(name)) return "mic";
  if (/ns.?10|genelec|adam|focal|barefoot/.test(name)) return "monitor";

  return null;
}

// Normalize a string for matching — lowercase, strip punctuation, collapse whitespace.
const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Dice on a single token-set pair.
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return (2 * hit) / (a.size + b.size);
}

function toks(s: string, minLen = 2): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length >= minLen));
}

// Normalize a brand for comparison — strip ALL non-alphanum (so "E-mu" → "emu"
// matches "EMU"). Without this, the hyphen splits the brand into tokens that
// don't survive the min-length filter.
function brandKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Strip the manufacturer name from the front of the model (Sanity stores
// names like "Akai MPC60" with the brand baked in; xlsx column B has just
// the model "MPC60II Integrated...").
function stripBrand(name: string, brand: string): string {
  if (!brand) return name;
  const b = brand.trim();
  const re = new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
  return name.replace(re, "").trim();
}

// Two-axis score: brand similarity must clear a floor before we even look at
// the model. Stops false matches like Roland Space Echo RE-201 ↔ Boss RE-20.
function scorePair(sanityName: string, sanityBrand: string, xlsx: XlsxRow): { brand: number; model: number; total: number } {
  const sb = brandKey(sanityBrand);
  const xb = brandKey(xlsx.brand);
  let brand = 0;
  if (sb && xb) {
    if (sb === xb) brand = 1;
    else if (sb.length >= 3 && xb.includes(sb)) brand = 0.9;
    else if (xb.length >= 3 && sb.includes(xb)) brand = 0.9;
  }

  // Model: try two paths and take the max
  //   (a) dice on token sets (handles "tx-6" vs "tx6 line module")
  //   (b) substring containment on the collapsed key (handles "MPC60" ⊂
  //       "mpc60ii integrated...", "Octatrack mk2" ⊂ "octatrack mkii dynamic 8-track...")
  // Strip the brand prefix from the sanity name first.
  const sanityModelOnly = stripBrand(sanityName, sanityBrand);
  const sm = brandKey(sanityModelOnly);   // "mpc60" / "octatrackmk2" / "tx6"
  const xm = brandKey(xlsx.model);         // "mpc60ii..." / "octatrackmkiidynamic..." / "tx6"
  let modelByContain = 0;
  if (sm.length >= 3 && xm.includes(sm)) modelByContain = 1;
  else if (xm.length >= 3 && sm.includes(xm)) modelByContain = 1;
  // Slight slack for trailing version digits / "ii" → "2" mismatches
  else {
    const sm2 = sm.replace(/(mk)?(ii|iii)$/i, "").replace(/(mk)?2$/, "");
    const xm2 = xm.replace(/(mk)?(ii|iii)$/i, "").replace(/(mk)?2$/, "");
    if (sm2.length >= 3 && xm2.includes(sm2)) modelByContain = 0.9;
    else if (xm2.length >= 3 && sm2.includes(xm2)) modelByContain = 0.9;
  }
  const modelByDice = dice(toks(sanityModelOnly, 2), toks(xlsx.model, 2));
  const model = Math.max(modelByContain, modelByDice);
  return { brand, model, total: brand * 0.4 + model * 0.6 };
}

async function main() {
  const rows = readXlsx();
  console.log(`📒 read ${rows.length} rows from xlsx\n`);

  const sanityItems = await sanity.fetch<{ _id: string; name: string; manufacturer?: string; category: string }[]>(
    `*[_type == "gear"] | order(category asc, name asc){ _id, name, manufacturer, category }`
  );
  console.log(`📦 ${sanityItems.length} sanity gear docs\n`);

  let updated = 0, unchanged = 0, unmatched = 0, nomap = 0;
  for (const item of sanityItems) {
    // Two-axis match: require strong brand alignment first.
    let best: { s: { brand: number; model: number; total: number }; row: XlsxRow } | null = null;
    for (const r of rows) {
      const s = scorePair(item.name, item.manufacturer ?? "", r);
      if (s.brand < 0.6) continue; // brand floor
      if (!best || s.total > best.s.total) best = { s, row: r };
    }
    if (!best || best.s.model < 0.4) {
      console.log(`  ✗ ${item.name}  (no xlsx match)`);
      unmatched += 1;
      continue;
    }
    const newCat = mapCategory(best.row.category, best.row.brand, best.row.model);
    if (!newCat) {
      // No xlsx category present at all — leave Sanity value alone
      nomap += 1;
      continue;
    }
    if (newCat === item.category) {
      unchanged += 1;
      continue;
    }
    await sanity.patch(item._id).set({ category: newCat }).commit();
    console.log(`  ✓ ${item.name}: ${item.category} → ${newCat}  (xlsx "${best.row.brand} ${best.row.model}" · "${best.row.category}")`);
    updated += 1;
  }

  console.log(
    `\n✅ ${updated} updated · ${unchanged} already correct · ${unmatched} not in xlsx · ${nomap} xlsx had no category`
  );
}
main().catch((err) => { console.error(err); process.exit(1); });
