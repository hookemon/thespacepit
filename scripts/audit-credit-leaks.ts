/**
 * Catalog-wide audit: scan every release's credits[] for IPI/PRO data
 * stored in free-text fields where it shouldn't be. Per
 * feedback_no_ipi_in_public_credits.md, publishing identifiers must
 * live only in writerCredits[] (private), never in credits[].name or
 * credits[].instrument.
 *
 * Patterns flagged:
 *   - 8-12 digit numeric runs (likely IPI/CAE)
 *   - "SESAC", "BMI", "ASCAP", "SOCAN", "PRS", "GMR", "GEMA", "SACEM",
 *     "JASRAC", "IPI", "CAE", "#"
 *
 * Run: npx tsx scripts/_audit-credit-leaks.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

const LEAK_PATTERNS = [
  /\b\d{8,12}\b/, // IPI/CAE-like digit runs
  /\bSESAC\b/i,
  /\bBMI\s*[#]/i,
  /\bASCAP\s*[#]/i,
  /\bSOCAN\b/i,
  /\bPRS\s*[#]/i,
  /\bGMR\s*[#]/i,
  /\bGEMA\b/i,
  /\bSACEM\b/i,
  /\bJASRAC\b/i,
  /\bIPI[\s:#]/i,
  /\bCAE[\s:#]/i,
];

function isLeak(s: string | null | undefined): string[] {
  if (!s) return [];
  return LEAK_PATTERNS.filter((p) => p.test(s)).map((p) => p.source);
}

async function main() {
  const releases = await client.fetch<Array<{ _id: string; title: string; slug: string; credits: Array<{ role?: string; name?: string; instrument?: string }> }>>(
    `*[_type == "release" && defined(credits)]{
      _id, title, "slug": slug.current,
      "credits": credits[]{ role, name, instrument }
    }`,
  );

  console.log(`Scanned ${releases.length} releases with credits.\n`);
  const findings: Array<{ slug: string; title: string; row: number; field: string; value: string; patterns: string[] }> = [];

  for (const r of releases) {
    r.credits?.forEach((c, i) => {
      for (const field of ["name", "instrument"] as const) {
        const v = c[field];
        const matched = isLeak(v);
        if (matched.length > 0) {
          findings.push({ slug: r.slug, title: r.title, row: i, field, value: v!, patterns: matched });
        }
      }
    });
  }

  if (findings.length === 0) {
    console.log("✓ No leaks found across catalog.");
    return;
  }

  console.log(`⚠️  ${findings.length} suspect credit row(s) across ${new Set(findings.map((f) => f.slug)).size} release(s):\n`);
  for (const f of findings) {
    console.log(`  • ${f.title} (/releases/${f.slug}) — credit[${f.row}].${f.field}`);
    console.log(`      patterns: ${f.patterns.join(", ")}`);
    console.log(`      value:    ${f.value.replace(/\n/g, " | ").slice(0, 160)}`);
    console.log();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
