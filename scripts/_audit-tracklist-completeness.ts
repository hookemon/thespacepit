/**
 * For each owned release, compare the count of numbered main-audio files in
 * the catalog folder against the Sanity tracklist length. Flags releases
 * where the source folder has MORE tracks than Sanity — meaning the
 * tracklist is incomplete (LDCC001 Josephine pattern).
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, join, basename } from "path";
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production", apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

const OWNED = ["Calm + Collect", "Calm + Collect Instrumental", "Lockhart Dynasty × Calm + Collect", "Hookemon", "Calllm"];
const CATALOG_ROOT = process.env.CC_CATALOG_ROOT!;
const IMPRINT_DIRS: Record<string, string> = {
  "Calm + Collect": "1-Calm + Collect",
  "Calm + Collect Instrumental": "1-Calm + Collect",
  "Lockhart Dynasty × Calm + Collect": "2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)",
  "Hookemon": "3-Hookemon Records",
  "Calllm": "4-CALLLM (Ambient Imprint)",
};

function extractTrackNumber(filename: string): number | null {
  const name = basename(filename);
  const discTrack = name.match(/^(\d{1,2})[-_.](\d{1,3})[\s\-_.]/);
  if (discTrack) {
    const disc = parseInt(discTrack[1], 10);
    const track = parseInt(discTrack[2], 10);
    if (disc >= 1 && disc <= 4) return track;
  }
  const m = name.match(/^(\d{1,3})[\s\-_.]/);
  return m ? parseInt(m[1], 10) : null;
}

async function walkMainAudioFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries: string[];
    try { entries = await readdir(d); } catch { return; }
    for (const name of entries) {
      if (name.startsWith(".") || /^(STEMS|SAMPLE PACK|ART|VIDEO CONTENT|VIZUALIZERS?|PHOTOS|PRESS|PROMOS?)/i.test(name)) continue;
      const full = join(d, name);
      const s = await stat(full).catch(() => null);
      if (!s) continue;
      if (s.isDirectory()) await walk(full);
      else if (/\.(wav|mp3|m4a|aif|aiff|flac)$/i.test(name)) {
        if (/\b(stem|drums|bass|vox|vocal|kick|snare|hat|fx)\b/i.test(name)) continue;
        out.push(full);
      }
    }
  }
  await walk(dir);
  // Dedupe by normalized basename (WAV/MP3/Promos variants)
  const seen = new Set<string>();
  return out.filter((f) => {
    const k = basename(f).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function findReleaseFolder(label: string, catalogNumber: string, title: string): Promise<string | null> {
  const imprintDir = IMPRINT_DIRS[label];
  if (!imprintDir) return null;
  const path = join(CATALOG_ROOT, imprintDir);
  if (!existsSync(path)) return null;
  const folders = await readdir(path);
  if (catalogNumber) {
    const cn = catalogNumber.toUpperCase();
    const exact = folders.find((f) => new RegExp(`^${cn}([-: ]|$)`).test(f.toUpperCase()));
    if (exact) return join(path, exact);
  }
  return null;
}

(async () => {
  const rows = await c.fetch<Array<{ _id: string; title: string; catalogNumber?: string; label?: string; trackCount: number }>>(
    `*[_type == "release" && label in $labels && (withdrawn != true)] | order(label asc, catalogNumber asc) {
      _id, title, catalogNumber, label, "trackCount": count(tracklist)
    }`, { labels: OWNED }
  );

  const incomplete: Array<{ cn: string; title: string; sanityTracks: number; folderTracks: number; gap: number }> = [];
  for (const r of rows) {
    if (!r.label || !r.catalogNumber) continue;
    const folder = await findReleaseFolder(r.label, r.catalogNumber, r.title);
    if (!folder) continue;
    const files = await walkMainAudioFiles(folder);
    const numberedFiles = files.filter(f => extractTrackNumber(f) !== null);
    if (numberedFiles.length > r.trackCount) {
      incomplete.push({
        cn: r.catalogNumber, title: r.title,
        sanityTracks: r.trackCount, folderTracks: numberedFiles.length,
        gap: numberedFiles.length - r.trackCount
      });
    }
  }
  if (incomplete.length === 0) {
    console.log("✓ Every release has at least as many Sanity tracks as numbered source files. No gaps.");
    return;
  }
  console.log(`Releases where the source folder has more numbered tracks than the Sanity tracklist:\n`);
  console.log(`${"CN".padEnd(9)} ${"TITLE".padEnd(40)} ${"SANITY".padStart(7)}  ${"FOLDER".padStart(7)}  ${"GAP".padStart(4)}`);
  for (const r of incomplete.sort((a,b) => b.gap - a.gap)) {
    console.log(`${r.cn.padEnd(9)} ${r.title.padEnd(40).slice(0,40)} ${String(r.sanityTracks).padStart(7)}  ${String(r.folderTracks).padStart(7)}  ${String(r.gap).padStart(4)}`);
  }
})();
