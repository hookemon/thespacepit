/**
 * Bulk-tag every video about Teenage Engineering products by setting
 * `relatedBrand` to brand-teenage-engineering. Idempotent — won't overwrite
 * a relatedBrand that's already set to a different brand.
 *
 * Title patterns covered:
 *   teenage engineering, op-1, op-z, op-xy, ep-133, tp-7, ko ii,
 *   field, choir, oplab, m-2, pocket operator, po-12/po-33/etc.
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

const TE_BRAND_ID = "brand-teenage-engineering";

const TE_PATTERN = /\b(teenage engineering|teenageengineering|op[-\s]?1\b|op[-\s]?z\b|op[-\s]?xy\b|ep[-\s]?133\b|tp[-\s]?7\b|ko[-\s]?ii\b|ko[-\s]?2\b|oplab|m[-\s]?2 (?:portable|sound)|pocket operator|po[-\s]?\d{2,3}|tx[-\s]?6|field (?:speaker|recorder)|choir computer)\b/i;

(async () => {
  const candidates: { _id: string; title: string; relatedBrand?: { _ref: string } }[] = await c.fetch(
    `*[_type == "video" && hidden != true && !defined(relatedBrand)]{
      _id, title, relatedBrand
    }`
  );

  const matches = candidates.filter((v) => TE_PATTERN.test(v.title));
  console.log(`\n🏷  found ${matches.length} TE videos missing relatedBrand (out of ${candidates.length} unbranded videos)\n`);

  let patched = 0;
  for (const v of matches) {
    await c.patch(v._id).set({
      relatedBrand: { _type: "reference", _ref: TE_BRAND_ID },
    }).commit();
    patched++;
    if (patched <= 10 || patched % 10 === 0) {
      console.log(`  ✓ ${v.title.slice(0, 80)}`);
    }
  }
  console.log(`\n✅ done — ${patched} videos linked to ${TE_BRAND_ID}\n`);
})();
