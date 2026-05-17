/**
 * Patch the two OUT Relationships records (CC015 LP + CCINST001 Instrumentals)
 * with safe-default publishing/distribution metadata. These are the fields
 * added to the release schema on 2026-05-17 for the dossier pipeline:
 *   - pCopyright (℗ recording copyright)
 *   - cCopyright (© composition copyright)
 *   - language
 *   - genre
 *   - status (was null; set explicit so it doesn't fall to default behavior)
 *   - format (was null on both; both are full-length LPs)
 *
 * What this script does NOT touch — must come from Nick directly:
 *   - upc (per-release barcode)
 *   - writerCredits per track (name + share % + PRO + IPI/CAE + publisher)
 *   - subgenre (genre-dependent)
 *   - internalNotes (his private deal terms)
 *   - per-track bpm / explicit (track-level admin in Studio)
 *
 * Run: npx tsx scripts/patch-relationships-publishing.ts
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

async function main() {
  console.log("→ patching CC015 Relationships (2016 vocal LP)…");
  await client
    .patch("release-cc015-relationships")
    .set({
      pCopyright: "℗ 2016 Calm + Collect",
      cCopyright: "© 2016 Calm + Collect",
      language: "English",
      genre: "Hip-Hop/Rap",
      status: "out",
      format: "LP",
    })
    .commit();
  console.log("   ✓ done");

  console.log("\n→ patching CCINST001 Relationships (Instrumentals, 2025)…");
  await client
    .patch("release-ccinst001-relationships-instrumentals")
    .set({
      pCopyright: "℗ 2025 Calm + Collect Instrumental",
      // c-copyright intentionally left for Nick — instrumentals share the
      // underlying compositions with the 2016 LP but the publisher line
      // depends on his self-pub designee setup, which I shouldn't guess.
      language: "English",
      genre: "Hip-Hop/Rap (Instrumental)",
      status: "out",
      format: "LP",
    })
    .commit();
  console.log("   ✓ done");

  console.log("\nAll patches committed. Read back to confirm:");
  const after = await client.fetch(
    `*[_id in ["release-cc015-relationships", "release-ccinst001-relationships-instrumentals"]]{
      _id, title, status, format, language, genre, pCopyright, cCopyright
    }`,
  );
  console.log(JSON.stringify(after, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
