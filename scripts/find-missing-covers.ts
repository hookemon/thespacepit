/* eslint-disable no-console */
/** List all releases without a coverImage (or with a placeholder). */
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
  const all = await client.fetch<
    Array<{
      _id: string;
      title?: string;
      slug?: string;
      year?: number;
      catalogNumber?: string;
      label?: string;
      status?: string;
      artists?: { name?: string }[];
      hasCover: boolean;
      tracklist?: { title?: string; features?: string[] }[];
    }>
  >(
    `*[_type == "release" && (withdrawn != true)]{
      _id,
      title,
      "slug": slug.current,
      year,
      catalogNumber,
      label,
      status,
      "artists": artists[]->{name},
      "hasCover": defined(cover.asset),
      tracklist[]{ title, features }
    } | order(year asc, title asc)`,
  );
  const missing = all.filter((r) => !r.hasCover);
  console.log(`\n${missing.length} releases without cover:\n`);
  // Bucket by status so we know which are "live but coverless" vs stubs.
  const buckets: Record<string, typeof missing> = {};
  for (const r of missing) {
    const key = r.status ?? "(null)";
    (buckets[key] ??= []).push(r);
  }
  for (const [status, list] of Object.entries(buckets)) {
    console.log(`\n── status="${status}" (${list.length}) ──`);
    for (const r of list) {
      const artists = r.artists?.map((a) => a.name).join(" + ") ?? "—";
      console.log(`  • [${r.catalogNumber ?? "?"}] ${r.title} — ${artists} (${r.year ?? "?"})`);
      console.log(`    _id:  ${r._id}`);
      console.log(`    slug: ${r.slug}`);
      if (r.tracklist?.length) {
        console.log(`    tracks: ${r.tracklist.map((t) => t.title).filter(Boolean).join(" / ")}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
