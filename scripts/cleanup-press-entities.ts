/**
 * Decode HTML entities that leak into pressQuote headlines + excerpts
 * via OG scrapes (e.g. &#039; → ', &amp; → &). Scan all pressQuote docs
 * and patch in place. Idempotent.
 *
 * Run: npx tsx scripts/cleanup-press-entities.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false,
});

const NAMED: Record<string, string> = {
  "amp": "&", "lt": "<", "gt": ">", "quot": '"', "apos": "'",
  "nbsp": " ", "hellip": "…", "mdash": "—", "ndash": "–",
  "lsquo": "‘", "rsquo": "’", "ldquo": "“", "rdquo": "”",
  "trade": "™", "copy": "©", "reg": "®",
};

function decode(s: string | null | undefined): string | null | undefined {
  if (s == null) return s;
  return s
    // numeric: &#039; / &#x27;
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    // named: &amp; / &nbsp; / etc.
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m);
}

async function main() {
  const docs = await c.fetch<Array<{ _id: string; headline?: string; quote?: string; excerpt?: string }>>(
    `*[_type == "pressQuote"]{ _id, headline, quote, excerpt }`,
  );
  console.log(`scanning ${docs.length} pressQuote docs…\n`);

  let patched = 0;
  for (const d of docs) {
    const newHeadline = decode(d.headline);
    const newQuote = decode(d.quote);
    const newExcerpt = decode(d.excerpt);
    const changed =
      newHeadline !== d.headline || newQuote !== d.quote || newExcerpt !== d.excerpt;
    if (!changed) continue;

    const set: Record<string, string | undefined> = {};
    if (newHeadline !== d.headline) set.headline = newHeadline ?? undefined;
    if (newQuote !== d.quote) set.quote = newQuote ?? undefined;
    if (newExcerpt !== d.excerpt) set.excerpt = newExcerpt ?? undefined;

    await c.patch(d._id).set(set).commit();
    patched += 1;
    console.log(`✓ ${d._id} — ${(newHeadline ?? "").slice(0, 70)}`);
  }
  console.log(`\ndone. patched=${patched} of ${docs.length}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
