/* eslint-disable no-console */
/**
 * Pre-pass to the cover backfill: clean up the two coverless-but-shouldnt-be-public releases:
 *   - release-stub-young-thug-nick-hook-remix: duplicate stub of the
 *     Old English (Spinn + Hook + Scatta VIP) doc that already exists.
 *     No incoming refs — safe to delete.
 *   - release-cc028-drums-2: upcoming, referenced by project-calm-collect.
 *     Keep, but set status="upcoming" so the catalog filter hides it.
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
  console.log("→ deleting orphan stub release-stub-young-thug-nick-hook-remix…");
  try {
    await client.delete("release-stub-young-thug-nick-hook-remix");
    console.log("   ✓ deleted");
  } catch (e) {
    console.log("   ! delete failed:", (e as Error).message);
  }

  console.log("\n→ patching release-cc028-drums-2 status=upcoming…");
  await client
    .patch("release-cc028-drums-2")
    .set({ status: "upcoming" })
    .commit();
  console.log("   ✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
