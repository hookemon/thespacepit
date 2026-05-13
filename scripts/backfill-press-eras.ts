/**
 * Heuristic backfill of `relatedEra` on pressQuote docs.
 *
 * 185 of 218 press docs have no era tag. They're all keyworded enough in
 * their headline/quote/outlet that we can confidently auto-tag the obvious
 * ones. Conservative — first matching pattern wins, ambiguous skips stay
 * untagged (the master /press page still shows them).
 *
 * Run with --dry-run to preview before writing.
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

/** Era slug → regex that, if any field matches, tags the press doc.
 *  First match wins, so list specific eras before catch-all ones. */
const ERA_PATTERNS: { era: string; pattern: RegExp }[] = [
  // CZ specifically — before any RTJ patterns, since headlines can mention both
  { era: "cubic-zirconia",            pattern: /\b(cubic zirconia|tiombe lockhart|lockhart dynasty|josephine.*cubic|follow your heart.*cz|fuck work|holy calamafuck)\b/i },
  // MWC band-years (Reprise/Warner 2004-08)
  { era: "men-women-children",        pattern: /\b(men women|men, women|mwc|nettwerk|reprise(?!-)|warner.*nick hook|panic.*at the disco|nightmare of you|lostprophets)\b/i },
  // Boo
  { era: "gangsta-boo-live-studio",   pattern: /\b(gangsta boo|gangstaboo|lola mitchell|three 6 mafia|three-6-mafia)\b/i },
  // RTJ + Cu4tro
  { era: "run-the-jewels-tour-2017",  pattern: /\b(cu4tro|run the jewels.*(tour|cu4tro|latin|mexico|2017))\b/i },
  { era: "rtj-10th-anniversary",      pattern: /\b(rtj.*10|run the jewels.*(10|anniversary|decade))\b/i },
  // RBMA fellowship era
  { era: "red-bull-rbma",             pattern: /\b(red bull music academy|rbma|red bull studios)\b/i },
  // Sónar
  { era: "s-nar",                     pattern: /\bs[oó]nar\b/i },
  // CC label era
  { era: "calm-collect",              pattern: /\b(calm \+ collect|calm and collect|spiritual friendship|electrogenetic|gareth jones|calllm)\b/i },
  // Solo DJ + live (catch-all for solo Nick Hook DJ/production pieces)
  { era: "solo-dj-live",              pattern: /\b(nick hook.*(dj|production|solo|baauer|young thug|trippy turtle|50 backwoods|relationships|color film|nadus|junglepussy)|nick hook.*XLR8R|XLR8R.*nick hook)\b/i },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`mode: ${dryRun ? "DRY RUN" : "WRITE"}\n`);

  // Pull every untagged press doc with the fields we'll match against.
  const press = await c.fetch<Array<{
    _id: string;
    quote: string;
    headline?: string;
    excerpt?: string;
    outlet?: string;
    source?: string;
  }>>(`*[_type == "pressQuote" && !defined(relatedEra)]{ _id, quote, headline, excerpt, outlet, source }`);

  const tally: Record<string, number> = {};
  let tagged = 0;
  let skipped = 0;

  for (const p of press) {
    // Concatenate all text fields for matching. Patterns ignore case.
    const hay = [p.headline, p.excerpt, p.quote, p.outlet, p.source]
      .filter(Boolean)
      .join(" \n ");
    const match = ERA_PATTERNS.find((e) => e.pattern.test(hay));
    if (!match) {
      skipped++;
      continue;
    }
    tally[match.era] = (tally[match.era] ?? 0) + 1;
    tagged++;
    console.log(`  +${match.era.padEnd(28)} ← ${(p.headline ?? p.quote).slice(0, 80)}`);
    if (!dryRun) {
      await c.patch(p._id).set({
        relatedEra: { _type: "reference" as const, _ref: `project-${match.era}` },
      }).commit();
    }
  }

  console.log(`\n--- summary ---`);
  console.log(`  tagged:  ${tagged}`);
  console.log(`  skipped: ${skipped}\n`);
  console.log(`  per era:`);
  for (const [era, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${era.padEnd(28)} +${n}`);
  }
  if (dryRun) console.log(`\n(DRY RUN — no Sanity writes.)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
