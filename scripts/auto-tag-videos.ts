/**
 * Auto-tag videos that have empty `tags`.
 *
 * Heuristic ranking — first match wins. We only assign tags we're CONFIDENT
 * about; ambiguous titles stay untagged and get listed at the end for manual
 * pass. Tags chosen are part of the existing schema vocab.
 *
 * Strategy:
 *   1. Date-only titles ("May 18, 2025") + "tuning in" + "we back" → livestream
 *   2. Gear keywords (OPXY, KO II, TP-7, SP-404, EP-1320, stylophone, move) → gear-demo
 *   3. "tutorial" / "learning" / "how to" / "walkthrough" → tutorial
 *   4. "live at" / "@ [venue]" / "en vivo" / "(live)" → live-set
 *   5. "Nick Hook-[Title] Ft.[Artist]" pattern → music-video
 *      (these are audio uploads of his solo tracks — they're how visitors hear
 *       his catalog on YouTube; we treat the YT-side as a music-video slot)
 *   6. "+ [name]" or "x [name]" or "con [name]" jam shorthand → studio-session
 *
 * Each video can pick up multiple tags (e.g. "TP-7 jam with Lrel" → gear-demo
 * + studio-session). We dedupe before writing.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const GEAR_KEYWORDS = [
  "opxy", "op-xy", "op xy",
  "ko ii", "ko2", "ko-ii", "ep-133", "ep133",
  "tp-7", "tp7", "tp 7",
  "sp-404", "sp404", "404 mkii", "sp404mkii",
  "ep-1320", "ep1320", "medieval",
  "ableton move", "ableton push", "push 3", "push 2",
  "mpc", "mpc60", "mpc2500",
  "stylophone",
  "moog", "sub 37", "sub37",
  "modular", "patch",
  "drum machine", "drum-machine",
  "808", "tr-808",
  "serato",
];

const LIVESTREAM_PATTERNS = [
  /tuning in/i,
  /we back/i,
  /\bsession\s+(live|stream)/i,
  /^\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\s*$/i,
  /^\s*\d{1,2}\.\d{1,2}\b/, // "2.11 LATE NIGHT TRACKING"
  /late night tracking/i,
  /^\s*tsp\s*$/i,
  /^\s*we'?re? in here/i,
  /^\s*clocking with/i,
  /^\s*setting up/i,
  /^\s*let'?s? make (a song|fire)/i,
  /^\s*who wanna battle/i,
];

const LIVE_SET_PATTERNS = [
  /\ben vivo\b/i,
  /\bat the (greenhouse|globe|knockdown|output)/i,
  /\@ the\b/i,
  /\(live\)/i,
];

const TUTORIAL_PATTERNS = [
  /\btutorial\b/i,
  /\blearning sesh\b/i,
  /\bhow to\b/i,
  /\bwalkthrough\b/i,
  /\bfirmware\b/i,
  /\bbuilding presets?\b/i,
  /\bstock(ing)? up\b/i,
];

const MUSIC_VIDEO_PATTERNS = [
  // "Nick Hook- Title Ft. Artist" or "Nick Hook-Title Ft.Artist"
  /^nick hook\s*[-—]+\s*[^]+\s+ft\.?\s+/i,
  /^nick hook\s*[-—]+\s*[^]+\s+feat\.?\s+/i,
  // (Official Video)
  /\(official (music )?video\)/i,
  // "Nick Hook- Title" with a song-like title (no other markers)
  /^nick hook\s*[-—]+\s*[a-zA-Z][^]+$/i,
];

const COLLAB_JAM_PATTERNS = [
  /\bnick hook\s*\+\s*[a-z]/i,
  /\bhook\s*[+x]\s*[a-z]/i,
  /\bcon (lrel|cassie|kid kreep|el)\b/i,
  /\b\+\s*lrel\b/i,
  /\b\+\s*cassie\b/i,
  /\b\+\s*kid kreep\b/i,
];

const RTJ_PATTERNS = [/run the jewels/i, /\brtj\b/i, /el-p/i, /killer mike/i];
const CHAKRA_PATTERNS = [/\bchakra\b/i, /\bdrone(s)? for\b/i, /meditation/i, /calllm/i];
const MEDELLIN_PATTERNS = [/medell[ií]n/i, /\bla burbuja\b/i, /\bcolombia\b/i];

interface Video {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  relatedRelease?: { _ref: string } | null;
}

function classify(v: Video): string[] {
  const t = `${v.title} ${v.description ?? ""}`.toLowerCase();
  const tags = new Set<string>();

  if (LIVESTREAM_PATTERNS.some((r) => r.test(v.title))) tags.add("livestream");
  if (LIVE_SET_PATTERNS.some((r) => r.test(t))) tags.add("live-set");
  if (TUTORIAL_PATTERNS.some((r) => r.test(t))) tags.add("tutorial");
  if (GEAR_KEYWORDS.some((k) => t.includes(k))) tags.add("gear-demo");
  if (MUSIC_VIDEO_PATTERNS.some((r) => r.test(v.title))) tags.add("music-video");
  if (COLLAB_JAM_PATTERNS.some((r) => r.test(v.title))) tags.add("studio-session");
  if (RTJ_PATTERNS.some((r) => r.test(t))) tags.add("rtj");
  if (CHAKRA_PATTERNS.some((r) => r.test(t))) tags.add("chakra");
  if (MEDELLIN_PATTERNS.some((r) => r.test(t))) tags.add("medellin");

  // Music-video sanity check: if "music-video" AND ALSO "gear-demo" /
  // "studio-session" / "livestream", the music-video tag is probably wrong
  // (a "Nick Hook + Lrel" jam isn't a music video). Drop it.
  if (tags.has("music-video") && (tags.has("gear-demo") || tags.has("studio-session") || tags.has("livestream"))) {
    tags.delete("music-video");
  }

  return Array.from(tags);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const untagged = await c.fetch<Video[]>(
    `*[_type == "video" && (count(coalesce(tags, [])) == 0)]{ _id, title, description, tags, relatedRelease }`
  );
  console.log(`untagged videos: ${untagged.length}`);
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  console.log("---");

  const stats: Record<string, number> = {};
  const stillUntagged: Video[] = [];
  let written = 0;

  for (const v of untagged) {
    const newTags = classify(v);
    if (newTags.length === 0) {
      stillUntagged.push(v);
      continue;
    }
    for (const t of newTags) stats[t] = (stats[t] ?? 0) + 1;
    if (!dryRun) {
      await c.patch(v._id).set({ tags: newTags }).commit();
    }
    written++;
    console.log(`  [${newTags.join(", ").padEnd(38)}]  ${v.title.slice(0, 80)}`);
  }

  console.log("\n--- summary ---");
  console.log(`tagged:           ${written}`);
  console.log(`still untagged:   ${stillUntagged.length}`);
  console.log("\ntags added:");
  for (const [k, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  +${k.padEnd(22)} ${n}`);
  }

  if (stillUntagged.length > 0) {
    console.log("\n--- still untagged (needs human eyeball) ---");
    for (const v of stillUntagged) console.log(`  ${v.title.slice(0, 100)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
