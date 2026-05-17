/**
 * Migrate the schema rename: writerCredits[].share → writerCredits[].writerShare,
 * and seed writerCredits[].publisherShare = writerShare for existing rows
 * (they were equal under the old single-field representation).
 *
 * Affects only the 3 releases we patched this session (CC015 Relationships,
 * MWC self-titled, MWC maxi) — but written defensively to scan everything.
 *
 * Run: npx tsx scripts/migrate-writer-share-split.ts
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

type LegacyWC = {
  _key?: string;
  name: string;
  share?: number;
  writerShare?: number;
  publisherShare?: number;
  [k: string]: unknown;
};

async function main() {
  const releases = await client.fetch<Array<{ _id: string; title: string; tracklist?: Array<{ _key: string; writerCredits?: LegacyWC[] }> }>>(
    `*[_type == "release" && count(tracklist[defined(writerCredits)]) > 0]{
      _id, title,
      "tracklist": tracklist[]{ _key, writerCredits }
    }`,
  );
  console.log(`Found ${releases.length} release(s) with writerCredits.\n`);

  for (const r of releases) {
    if (!r.tracklist) continue;
    let touched = 0;
    const newTracklist = r.tracklist.map((t) => {
      if (!t.writerCredits || t.writerCredits.length === 0) return t;
      const migratedWC = t.writerCredits.map((wc) => {
        // Don't re-migrate rows already on the new shape.
        if (wc.writerShare != null || wc.publisherShare != null) return wc;
        if (wc.share == null) return wc;
        touched += 1;
        const { share, ...rest } = wc;
        return { ...rest, writerShare: share, publisherShare: share };
      });
      return { ...t, writerCredits: migratedWC };
    });

    if (touched === 0) {
      console.log(`  · ${r.title} — no rows needed migration`);
      continue;
    }
    console.log(`→ ${r.title}: migrating ${touched} writerCredit row(s)…`);
    // We re-write the full tracklist with the migrated writerCredits.
    // Other track fields (title, isrc, lyrics, etc.) are preserved because
    // we only project + re-write writerCredits inside each track.
    const fullTracklist = await client.fetch<unknown[]>(`*[_id == $id][0].tracklist`, { id: r._id });
    const newFull = (fullTracklist as Array<{ _key: string }>).map((orig) => {
      const updated = newTracklist.find((u) => u._key === orig._key);
      if (!updated?.writerCredits) return orig;
      return { ...orig, writerCredits: updated.writerCredits };
    });
    await client.patch(r._id).set({ tracklist: newFull }).commit();
    console.log(`  ✓ committed`);
  }

  console.log("\n→ post-migration sanity check…");
  const after = await client.fetch(
    `*[_type == "release" && count(tracklist[defined(writerCredits)]) > 0]{
      title,
      "remainingShareField": count(tracklist[count(writerCredits[defined(share)]) > 0])
    }`,
  );
  console.log(JSON.stringify(after, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
