/**
 * Fix the IPI privacy leak on the MWC self-titled release.
 *
 * Current state: `credits[0]` has role="songwriter" with a free-text
 * `name` field that contains 5 writer names + their PROs + IPI numbers,
 * all rendered publicly. Per feedback_no_ipi_in_public_credits.md,
 * publishing identifiers must NEVER appear in any public field.
 *
 * Fix:
 *   1. Remove the dump-style "songwriter" credit row.
 *   2. Add 5 clean "Written by" credit rows — name only, no IPI/PRO.
 *      Nick links to artist-nick-hook (person ref); the rest as name
 *      fallbacks (no artist docs for them yet).
 *   3. Add writerCredits[] per track (PRIVATE) — same 5 writers, 20%
 *      each, with PROs + IPIs + Sell Your Money Music publisher (the
 *      MWC-era band publisher, distinct from Hookemon Songs).
 *   4. Set release-level pCopyright / cCopyright for the Reprise 2006
 *      release.
 *
 * Note: Nick's IPI was mistyped in the legacy dump as 00467494410.
 * The canonical value (per Master Discog 2.0 and every other entry
 * across his catalog) is 00467494116. Fixing the typo.
 *
 * Run: npx tsx scripts/patch-mwc-fix-ipi-leak.ts
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

// The 5 MWC band members as writers — same on every track, 20% each.
type WC = { _key: string; name: string; share: number; pro: string; ipiCae: string; publisher: string; publisherPro: string; publisherIpiCae: string };
const MWC_WRITERS: WC[] = [
  { _key: "wc-nick", name: "Nicholas Conceller", share: 20, pro: "SESAC", ipiCae: "00467494116", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-richard", name: "Richard Penzone", share: 20, pro: "BMI", ipiCae: "00467481423", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-tom-p", name: "Thomas Penzone", share: 20, pro: "BMI", ipiCae: "00467494018", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-tom-s", name: "Thomas Sullivan", share: 20, pro: "BMI", ipiCae: "00358446923", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
  { _key: "wc-todd", name: "Todd Weinstock", share: 20, pro: "BMI", ipiCae: "00196359621", publisher: "Sell Your Money Music", publisherPro: "BMI", publisherIpiCae: "00503499551" },
];

// Clean public "Written by" credit rows — name only, no PRO/IPI. Nick
// references his artist doc; others are name-only since they don't have
// artist docs (yet).
const WRITTEN_BY_CREDITS = [
  { _key: "wb-nick", role: "Written by", person: { _type: "reference", _ref: "artist-nick-hook" } },
  { _key: "wb-richard", role: "Written by", name: "Richard Penzone" },
  { _key: "wb-tom-p", role: "Written by", name: "Thomas Penzone" },
  { _key: "wb-tom-s", role: "Written by", name: "Thomas Sullivan" },
  { _key: "wb-todd", role: "Written by", name: "Todd Weinstock" },
];

async function main() {
  console.log("→ fetching current MWC release…");
  const r = await client.fetch<{ credits: Array<{ _key?: string; role?: string; name?: string }>; tracklist: Array<{ _key: string; title: string }> }>(
    `*[_id == "release-mwc-self-titled"][0]{ credits, tracklist }`,
  );
  if (!r) throw new Error("MWC self-titled not found");

  // 1. Strip the dump-style songwriter row. Match defensively by either
  //    role="songwriter" OR a name field containing "SESAC" / "BMI #".
  const cleanCredits = r.credits.filter((c) => {
    const isSongwriterRow = c.role?.toLowerCase() === "songwriter";
    const hasIpiDump = c.name && /(SESAC|BMI\s*#|ASCAP\s*#|\d{8,})/.test(c.name);
    return !(isSongwriterRow || hasIpiDump);
  });
  const stripped = r.credits.length - cleanCredits.length;
  console.log(`   stripped ${stripped} legacy credit row(s) carrying IPI data`);

  // 2. Prepend the clean Written-by credits so they sit at the top of
  //    the credits block (matches the convention of leading with writers).
  const newCredits = [...WRITTEN_BY_CREDITS, ...cleanCredits];

  // 3. Add writerCredits[] to each existing track. All 12 tracks have
  //    the same 5 band writers at 20% each.
  const newTracklist = r.tracklist.map((t) => ({ ...t, writerCredits: MWC_WRITERS }));

  console.log("\n→ committing patch (credits rewrite + per-track writerCredits + ℗©)…");
  await client
    .patch("release-mwc-self-titled")
    .set({
      credits: newCredits,
      tracklist: newTracklist,
      pCopyright: "℗ 2006 Reprise Records (Warner Music Group)",
      cCopyright: "© 2006 Sell Your Money Music",
    })
    .commit();
  console.log("   ✓ committed");

  console.log("\n→ verifying public credits no longer leak…");
  const after = await client.fetch(
    `*[_id == "release-mwc-self-titled"][0]{
      pCopyright, cCopyright,
      "credits": credits[]{ role, name, "person": person->name },
      "trackWriterCount": count(tracklist[defined(writerCredits)])
    }`,
  );
  console.log(JSON.stringify(after, null, 2));

  // Scan for any leftover digit-runs that could be IPIs
  const json = JSON.stringify(after);
  const leftover = json.match(/\b\d{8,12}\b/g) || [];
  console.log("\nLeftover digit-runs in credits (should be empty):", leftover);
}

main().catch((e) => { console.error(e); process.exit(1); });
