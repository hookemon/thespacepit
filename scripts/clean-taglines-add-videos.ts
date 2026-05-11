/**
 * Clean up taglines I wrote (per Nick: "not cute, you'll find that out when you
 * go in"), plus attach two new music video URLs to Tardes + Need For Speed.
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

type TL = { _key?: string; title?: string; videoUrl?: string };

async function patchVideoOnTrack(slug: string, trackMatch: RegExp, videoUrl: string) {
  const r = await client.fetch<{ _id: string; title: string; tracklist?: TL[] } | null>(
    `*[_type == "release" && slug.current == $slug][0]{ _id, title, tracklist }`,
    { slug }
  );
  if (!r) {
    console.warn(`  ⚠ no release: ${slug}`);
    return;
  }
  const list = r.tracklist ?? [];
  // If there's exactly one track or one matching track, target it.
  let idx = list.findIndex((t) => trackMatch.test(t.title?.toLowerCase() ?? ""));
  if (idx === -1 && list.length === 1) idx = 0;
  if (idx === -1) {
    console.warn(`  ⚠ no track match in ${slug}. tracks:`);
    for (const t of list) console.warn(`     - ${t.title}`);
    return;
  }
  const updated = list.map((t, i) => (i === idx ? { ...t, videoUrl } : t));
  await client.patch(r._id).set({ tracklist: updated, youtubeUrl: videoUrl }).commit({ autoGenerateArrayKeys: true });
  console.log(`  ✓ ${r.title}: video on "${list[idx].title}"`);
}

async function main() {
  // 1. Strip the "not cute" taglines.
  const stripSlugs = [
    "cc027-what-you-gonna-do",
    "clm003-root",
    "clm004-sacral",
    "clm005-solar-plexus",
    "clm006-heart",
    "clm007-throat",
    "clm008-third-eye",
    "clm009-crown",
  ];
  console.log("Stripping taglines I wrote:");
  for (const slug of stripSlugs) {
    const r = await client.fetch<{ _id: string; title: string; tagline?: string } | null>(
      `*[_type == "release" && slug.current == $slug][0]{ _id, title, tagline }`,
      { slug }
    );
    if (!r) continue;
    if (!r.tagline) {
      console.log(`  · ${r.title} (already empty)`);
      continue;
    }
    await client.patch(r._id).unset(["tagline"]).commit();
    console.log(`  ✓ stripped on ${r.title}`);
  }

  // 2. Attach the two new music video URLs.
  console.log("\nAttaching music videos:");
  await patchVideoOnTrack("cc018-tardes-de-verano", /tardes|verano/i, "https://www.youtube.com/watch?v=Qc79Dj5Gzu0");
  await patchVideoOnTrack("cc005-need-for-speed", /need|speed/i, "https://www.youtube.com/watch?v=hHleuP2qKlI");

  console.log("\n✅ done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
