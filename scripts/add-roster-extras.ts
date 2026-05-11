/**
 * Add Gangsta Boo + Taso to the Calm + Collect roster (onLabel: true).
 *
 * Why: they don't have releases on the imprint but Nick wants them on the
 * roster page as part of the fam — Gangsta Boo (decades of touring + the
 * I'm Fresh / Peephole records) and Taso (footwork foundation, long-time
 * collaborator).
 *
 * Idempotent — uses createOrReplace keyed by deterministic _id.
 *
 * Run:  npx tsx scripts/add-roster-extras.ts
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type ArtistSeed = {
  name: string;
  city?: string;
  tagline?: string;
  instagramUrl?: string;
  bandcampUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
};

const EXTRAS: ArtistSeed[] = [
  {
    name: "Gangsta Boo",
    city: "memphis",
    tagline: "the queen of memphis. 30 dates with nick on the rtj 2017 run; the i’m fresh / peephole records. forever.",
    instagramUrl: "https://www.instagram.com/therealgangstaboo/",
    spotifyUrl: "https://open.spotify.com/artist/3M8FzayQWtkvFcqp1lF21V",
  },
  {
    name: "Taso",
    city: "chicago",
    tagline: "footwork's keeper. teklife. long-time collaborator at the pit.",
    instagramUrl: "https://www.instagram.com/teklifetaso/",
    spotifyUrl: "https://open.spotify.com/artist/24aoqzUUGl87Xon0Rq4XuO",
  },
];

async function upsertArtist(a: ArtistSeed) {
  const slug = slugify(a.name);
  const _id = `artist-${slug}`;

  // Look up by slug first — if there's an existing doc with a different _id
  // (created via the studio UI), update IT instead of creating a duplicate.
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && slug.current == $slug][0]{ _id }`,
    { slug }
  );

  const targetId = existing?._id ?? _id;

  await client
    .patch(targetId)
    .setIfMissing({
      _type: "artist",
      name: a.name,
      slug: { _type: "slug", current: slug },
    })
    .set({
      onLabel: true,
      ...(a.city ? { city: a.city } : {}),
      ...(a.tagline ? { tagline: a.tagline } : {}),
      ...(a.instagramUrl ? { instagramUrl: a.instagramUrl } : {}),
      ...(a.bandcampUrl ? { bandcampUrl: a.bandcampUrl } : {}),
      ...(a.spotifyUrl ? { spotifyUrl: a.spotifyUrl } : {}),
      ...(a.websiteUrl ? { websiteUrl: a.websiteUrl } : {}),
    })
    .commit({ autoGenerateArrayKeys: true })
    .catch(async (err: unknown) => {
      // If the doc didn't exist, create it.
      const message = err instanceof Error ? err.message : String(err);
      if (/does not exist|not found/i.test(message)) {
        await client.create({
          _id: targetId,
          _type: "artist",
          name: a.name,
          slug: { _type: "slug", current: slug },
          onLabel: true,
          ...a,
        });
      } else {
        throw err;
      }
    });

  console.log(`  ✓ ${a.name} → /artists/${slug}  (onLabel: true)`);
}

async function main() {
  console.log(`📝 Adding ${EXTRAS.length} extras to the CC roster...\n`);
  for (const a of EXTRAS) {
    await upsertArtist(a);
  }
  console.log(`\n✅ done`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
