/* eslint-disable no-console */
/**
 * Per Nick's note: for Old English press, ALWAYS use the original yellow
 * Mass Appeal bottle artwork. The slime-green C+C version (on the 2026
 * "DJ Spinn + Nick Hook + Scatta VIP" reissue) is reserved for NEW press
 * about the new release if/when we get any.
 *
 * Side effect: also links every Old English press doc to
 * release-ext-old-english-2014 (the original 2014 release) via
 * `releases[]` so it surfaces on that release's press grid.
 *
 * Idempotent — safe to re-run; already-yellow docs are no-ops.
 *
 * Run: npx tsx scripts/patch-old-english-press-yellow.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const YELLOW_ASSET_REF = "image-6d438112b0a078b54a158461cfc288a8a7d4c336-600x600-jpg";
const ORIGINAL_RELEASE_ID = "release-ext-old-english-2014";

async function main() {
  // Match by headline / URL — same matching as the audit.
  const press = await client.fetch<
    Array<{ _id: string; outlet?: string; headline?: string; releases?: { _ref: string }[] }>
  >(`*[_type == "pressQuote" && (
      headline match "*Old English*" ||
      headline match "*old english*" ||
      url match "*old-english*"
    )]{
      _id, outlet, headline, releases
    }`);

  console.log(`Found ${press.length} Old English press doc(s).\n`);

  for (const p of press) {
    const existingReleaseRefs = (p.releases ?? []).map((r) => r._ref);
    const newReleaseRefs = existingReleaseRefs.includes(ORIGINAL_RELEASE_ID)
      ? existingReleaseRefs
      : [...existingReleaseRefs, ORIGINAL_RELEASE_ID];

    await client
      .patch(p._id)
      .set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: YELLOW_ASSET_REF },
        },
        // Clear any scraped OG URL — yellow bottle wins, no hotlink fallback.
        imageUrl: null,
        // Link to the original release so it surfaces on its press grid.
        releases: newReleaseRefs.map((ref, i) => ({
          _key: `release-${ref.slice(-10)}-${i}`,
          _type: "reference",
          _ref: ref,
        })),
      })
      .commit();

    console.log(`  ✓ ${p._id}  (${p.outlet ?? "?"})`);
  }

  console.log("\nDone. All Old English press now uses the yellow Mass Appeal bottle.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
