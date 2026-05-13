/**
 * Men Women & Children press archive — additions / URL backfill.
 *
 * MWC is under-covered editorially online (most contemporaneous coverage
 * was print-era and is now paywalled or vanished). The original archive
 * import already created docs for the canonical pull quotes (NME, The Skinny,
 * Sputnikmusic, Amazon official copy). This script adds new URLs the agent
 * surfaced (LV Campus Times concert review, etc.) and patches any existing
 * MWC docs whose source URL we now have.
 *
 * Same shape / stableId pattern as import-press-urls.ts and the CZ script.
 *
 * Run: `npx tsx scripts/import-press-mwc.ts`
 * Dry: `npx tsx scripts/import-press-mwc.ts --dry`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DRY = process.argv.includes("--dry");

type Item = {
  outlet: string;
  author?: string;
  quote: string;
  headline?: string;
  kind?: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  year?: number;
  date?: string;
  url?: string;
  relatedEraSlug?: string;
  relatedReleaseSlug?: string;
  featured?: boolean;
};

const ITEMS: Item[] = [
  // ── CONCERT REVIEW ───────────────────────────────────────
  {
    outlet: "LV Campus Times",
    headline: "Concert Review: Men, Women and Children rock out (with De La Soul)",
    quote: "Cal Poly Pomona Bronco Fusion concert review — MW&C supporting De La Soul, September 2007.",
    kind: "review",
    date: "2007-09-19",
    url: "https://lvcampustimes.org/2007/09/concert-review-men-women-and-children-rock-out/",
    relatedEraSlug: "men-women-children",
  },
];

function stableId(it: Item): string {
  const h = createHash("sha1")
    .update(`${it.outlet}::${it.headline ?? ""}::${it.quote.slice(0, 80)}`)
    .digest("hex")
    .slice(0, 16);
  return `pressQuote-archive-${h}`;
}

async function resolveRef(type: string, slug: string): Promise<string | null> {
  const id = await c.fetch(`*[_type == $type && slug.current == $slug][0]._id`, { type, slug });
  return id || null;
}

(async () => {
  console.log(`\n📰 MWC press — ${ITEMS.length} items${DRY ? " (DRY)" : ""}\n`);
  let created = 0, patched = 0;

  for (const it of ITEMS) {
    const _id = stableId(it);
    const eraRef = it.relatedEraSlug ? await resolveRef("project", it.relatedEraSlug) : null;
    const releaseRef = it.relatedReleaseSlug ? await resolveRef("release", it.relatedReleaseSlug) : null;

    const doc: Record<string, unknown> = {
      _id,
      _type: "pressQuote",
      kind: it.kind ?? "review",
      outlet: it.outlet,
      ...(it.author ? { author: it.author } : {}),
      ...(it.headline ? { headline: it.headline } : {}),
      quote: it.quote,
      ...(it.date ? { date: it.date } : {}),
      ...(it.year ? { year: it.year } : {}),
      ...(it.url ? { url: it.url } : {}),
      ...(it.featured ? { featured: true } : {}),
      source: it.author ? `${it.author} · ${it.outlet}` : it.outlet,
      ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
      ...(releaseRef ? { relatedRelease: { _type: "reference", _ref: releaseRef } } : {}),
    };

    const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });
    const tag = it.url ? "🔗" : "  ";
    const label = `${it.outlet.padEnd(24)} ${(it.headline ?? it.quote).slice(0, 64)}`;

    if (DRY) {
      console.log(`   ${existing ? "↻" : "+"} ${tag} ${label}`);
      if (existing) patched++; else created++;
      continue;
    }

    if (existing) {
      await c.patch(_id).set(doc).commit();
      patched++;
      console.log(`   ↻ ${tag} ${label}`);
    } else {
      await c.create(doc);
      created++;
      console.log(`   + ${tag} ${label}`);
    }
  }

  console.log(`\n✅ ${created} created · ${patched} patched${DRY ? " (DRY)" : ""}\n`);
})();
