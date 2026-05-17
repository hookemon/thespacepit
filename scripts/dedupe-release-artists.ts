/* eslint-disable no-console */
/**
 * Detect + fix duplicate artist references on releases.
 *
 * Wormhole was rendering "Cadence Weapon · Cadence Weapon" because the
 * artists array had two refs to the same artist doc. React then warns
 * about "two children with the same key" in the list rendering. The fix
 * is structural: dedupe by `_ref` while preserving array order + keys.
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

const APPLY = process.argv.includes("--apply");

type ArtistRef = { _key?: string; _ref: string; _type?: string };
type Release = { _id: string; title: string; artists?: ArtistRef[] };

async function main() {
  const releases = await client.fetch<Release[]>(
    `*[_type == "release"]{
      _id, title, artists
    }`,
  );

  const dupes: { release: Release; before: number; after: number; newArtists: ArtistRef[] }[] = [];
  for (const r of releases) {
    if (!r.artists?.length) continue;
    const seen = new Set<string>();
    const next: ArtistRef[] = [];
    for (const a of r.artists) {
      if (!a?._ref) continue;
      if (seen.has(a._ref)) continue;
      seen.add(a._ref);
      next.push(a);
    }
    if (next.length !== r.artists.length) {
      dupes.push({ release: r, before: r.artists.length, after: next.length, newArtists: next });
    }
  }

  if (dupes.length === 0) {
    console.log("✓ no duplicate artist refs found");
    return;
  }

  console.log(`\nFound ${dupes.length} releases with duplicate artist refs:\n`);
  for (const d of dupes) {
    console.log(`  • ${d.release.title}  (${d.before} → ${d.after})`);
    console.log(`    _id: ${d.release._id}`);
  }

  if (!APPLY) {
    console.log("\n(dry run — pass --apply to commit patches)");
    return;
  }

  console.log("\n→ applying patches…");
  for (const d of dupes) {
    await client.patch(d.release._id).set({ artists: d.newArtists }).commit();
    console.log(`  ✓ ${d.release._id}`);
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
