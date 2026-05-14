/* eslint-disable no-console */
/**
 * Auto-link press to BRAND docs by outlet-name match.
 *
 * Why: many press pieces have outlet="The FADER" and we have a brand doc
 * for The FADER — but no link between them, so the brand's /partners/fader
 * page shows zero press even though we have 6 Fader pieces in the system.
 *
 * Match strategy: case-insensitive substring match on the press piece's
 * outlet (or fallback `source`) string against the brand's name. Liberal
 * on the brand side ("FADER" matches "The FADER", "The Fader" etc.).
 *
 * Skips pieces that already have relatedBrand set.
 *
 * Run: npx tsx scripts/autolink-press-to-brands.ts [--dry]
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

type Brand = { _id: string; name: string; slug: string };
type Press = { _id: string; outlet?: string; source?: string; relatedBrandRef?: string };

function norm(s: string): string {
  return s.toLowerCase().replace(/^the\s+/, "").replace(/[^\w]+/g, " ").trim();
}

async function main() {
  const [brands, press] = await Promise.all([
    client.fetch<Brand[]>(`*[_type == "brand"]{ _id, name, "slug": slug.current }`),
    client.fetch<Press[]>(
      `*[_type == "pressQuote"]{
        _id, outlet, source, "relatedBrandRef": relatedBrand._ref
      }`,
    ),
  ]);
  console.log(`Brands: ${brands.length}, Press: ${press.length}`);

  const brandIndex = brands.map((b) => ({ ...b, normName: norm(b.name) }));

  let toLink = 0;
  let alreadyLinked = 0;
  let noOutlet = 0;
  let multi = 0;
  const links: Array<{ press: Press; brand: Brand }> = [];

  for (const p of press) {
    if (p.relatedBrandRef) {
      alreadyLinked++;
      continue;
    }
    const blob = [p.outlet, p.source].filter(Boolean).join(" ").trim();
    if (!blob) {
      noOutlet++;
      continue;
    }
    const normBlob = norm(blob);
    // Match: brand's normalized name must appear in the outlet blob as a
    // whole word or substring (we accept substring since outlets vary —
    // "FACT Mag" should match "FACT").
    const hits = brandIndex.filter((b) => b.normName.length >= 3 && (
      normBlob.split(/\s+/).includes(b.normName) ||
      normBlob.includes(b.normName)
    ));
    if (hits.length === 0) continue;
    if (hits.length > 1) {
      // Prefer the brand whose name is longest (most specific match —
      // "Red Bull Music Academy" beats "Red Bull").
      hits.sort((a, b) => b.normName.length - a.normName.length);
      multi++;
    }
    links.push({ press: p, brand: hits[0] });
    toLink++;
  }

  console.log(`\nWould link ${toLink} press pieces → brands`);
  console.log(`Already linked: ${alreadyLinked}`);
  console.log(`No outlet/source: ${noOutlet}`);
  console.log(`Disambiguated via longest match: ${multi}`);

  // Show a frequency table of brands receiving links.
  const counts = new Map<string, number>();
  for (const l of links) counts.set(l.brand.slug, (counts.get(l.brand.slug) ?? 0) + 1);
  console.log("\nLinks per brand:");
  for (const [slug, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)} → ${slug}`);
  }

  if (DRY) return;

  let applied = 0;
  for (const l of links) {
    await client
      .patch(l.press._id)
      .set({ relatedBrand: { _type: "reference", _ref: l.brand._id } })
      .commit();
    applied++;
    if (applied % 20 === 0) process.stdout.write(`\r  applied ${applied}/${links.length}`);
  }
  process.stdout.write(`\r  applied ${applied}/${links.length}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
