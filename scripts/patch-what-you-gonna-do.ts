/**
 * Attach the "What You Gonna Do" music video URL to the corresponding track
 * on CC027. Idempotent — finds the track by title and sets videoUrl.
 *
 * Also patches:
 *  · top-level youtubeUrl on the release
 *  · tagline (the music video is the showcase)
 *  · (optional) — leaves space for Nick to add stems/pads/gallery in /studio
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

const VIDEO_URL = "https://www.youtube.com/watch?v=jQjbc3TCfo8";

type Track = { _key?: string; title?: string; videoUrl?: string };

async function main() {
  const release = await client.fetch<{
    _id: string;
    title: string;
    tracklist?: Track[];
  } | null>(`
    *[_type == "release" && slug.current == "cc027-what-you-gonna-do"][0]{
      _id, title, tracklist
    }
  `);
  if (!release) {
    console.error("CC027 release not found");
    process.exit(1);
  }

  const list = release.tracklist ?? [];
  let matched = -1;
  for (let i = 0; i < list.length; i += 1) {
    const t = list[i].title?.toLowerCase() ?? "";
    if (/what.*you.*gonna.*do/.test(t)) {
      matched = i;
      break;
    }
  }
  if (matched === -1) {
    console.error(`No track matched "what you gonna do". Tracklist:`);
    for (const t of list) console.error(`  - ${t.title}`);
    process.exit(1);
  }

  // Patch only that track's videoUrl, preserve everything else.
  const updated: Track[] = list.map((t, i) =>
    i === matched ? { ...t, videoUrl: VIDEO_URL } : t
  );

  await client
    .patch(release._id)
    .set({
      tracklist: updated,
      youtubeUrl: VIDEO_URL,
      tagline: "music video w/ logo no logo + kid kreep · directed by LREL · medellín 2025",
    })
    .commit({ autoGenerateArrayKeys: true });

  console.log(`✓ patched ${release.title}`);
  console.log(`  + videoUrl on track "${list[matched].title}"`);
  console.log(`  + youtubeUrl + tagline`);
  console.log(`\nopen the release at: /releases/cc027-what-you-gonna-do`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
