/* eslint-disable no-console */
/**
 * Auto-link orphan press to ERA / project docs (RTJ, MWC, CZ, etc.).
 *
 * Match: era project's name OR slug as a whole-word in the press piece's
 * headline / quote / url. Conservative — only links when exactly one
 * project matches.
 *
 * Run: npx tsx scripts/autolink-press-to-eras.ts [--dry]
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const DRY = process.argv.includes("--dry");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Project = { _id: string; name: string; slug: string; alternates?: string[] };
type Press = { _id: string; headline?: string; quote?: string; url?: string; outlet?: string; relatedEraRef?: string };

// Some project names are formal but the press uses casual variants.
// Augment the match set with these "also known as" aliases.
const ALIASES: Record<string, string[]> = {
  "run-the-jewels-tour-2017": ["run the jewels", "rtj"],
  "rtj-10th-anniversary": ["run the jewels", "rtj"],
  "men-women-children": ["men women children", "mwc", "men women and children", "men women & children"],
  "cubic-zirconia": ["cubic zirconia", "cz"],
  "gangsta-boo-live-studio": ["gangsta boo"],
  "calllm-ambient-sub-label": ["calllm"],
  "grand-theft-auto": ["grand theft auto", "gta v", "gta 5"],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function containsWhole(haystack: string, needle: string): boolean {
  if (needle.length < 3) return false;
  const h = norm(haystack);
  const n = norm(needle);
  const re = new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
  return re.test(h);
}

async function main() {
  const [projects, press] = await Promise.all([
    client.fetch<Project[]>(
      `*[_type == "project"]{ _id, name, "slug": slug.current }`,
    ),
    client.fetch<Press[]>(
      `*[_type == "pressQuote" && !defined(relatedEra)]{
        _id, headline, quote, url, outlet
      }`,
    ),
  ]);
  console.log(`Projects: ${projects.length}, Press without era: ${press.length}`);

  const projectsWithAliases = projects.map((p) => ({
    ...p,
    needles: [p.name, ...(ALIASES[p.slug] ?? [])],
  }));

  type Match = { pressId: string; projectId: string; needle: string };
  const matches: Match[] = [];
  const ambiguous: Array<{ pressId: string; hits: Match[] }> = [];

  for (const p of press) {
    const blob = [p.headline, p.quote, p.url, p.outlet].filter(Boolean).join(" || ");
    if (!blob) continue;
    const hits: Match[] = [];
    for (const proj of projectsWithAliases) {
      for (const needle of proj.needles) {
        if (containsWhole(blob, needle)) {
          hits.push({ pressId: p._id, projectId: proj._id, needle });
          break;
        }
      }
    }
    // Dedupe to one hit per project (in case multiple aliases hit).
    const uniq = Array.from(new Map(hits.map((h) => [h.projectId, h])).values());
    if (uniq.length === 1) matches.push(uniq[0]);
    else if (uniq.length > 1) ambiguous.push({ pressId: p._id, hits: uniq });
  }

  console.log(`\n→ ${matches.length} unique-match auto-links`);
  console.log(`→ ${ambiguous.length} ambiguous (multi-era piece — skipped)`);

  // Histogram by project.
  const counts = new Map<string, number>();
  for (const m of matches) counts.set(m.projectId, (counts.get(m.projectId) ?? 0) + 1);
  console.log("\nLinks per era:");
  for (const [proj, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)} → ${proj.replace(/^project-/, "")}`);
  }

  if (DRY) return;

  let applied = 0;
  for (const m of matches) {
    await client
      .patch(m.pressId)
      .set({ relatedEra: { _type: "reference", _ref: m.projectId } })
      .commit();
    applied++;
  }
  console.log(`\napplied ${applied}/${matches.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
