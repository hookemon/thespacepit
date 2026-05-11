import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  const KEY = process.env.YOUTUBE_API_KEY!;

  // Hit YouTube for the music-videos playlist
  const PLAYLIST = "PLMXEKDUSbulMePMHTBv3HA4uHM6rYvE75";
  console.log(`=== YouTube playlist ${PLAYLIST} ===`);
  let count = 0;
  let pageToken: string | undefined;
  const titles: string[] = [];
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", PLAYLIST);
    url.searchParams.set("key", KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString());
    const d = (await res.json()) as { items: { snippet: { title: string } }[]; nextPageToken?: string };
    for (const it of d.items) { titles.push(it.snippet.title); count++; }
    pageToken = d.nextPageToken;
  } while (pageToken);
  console.log(`  total: ${count} videos`);
  titles.slice(0, 12).forEach((t, i) => console.log(`  ${i+1}. ${t}`));
  if (titles.length > 12) console.log(`  ... +${titles.length - 12} more`);

  // Also check what Sanity sees as videos with tag "music-video"
  console.log(`\n=== Sanity video docs tagged "music-video" ===`);
  const tagged = await sanity.fetch<{ youtubeId: string; title: string }[]>(
    `*[_type == "video" && "music-video" in tags && hidden != true]{ youtubeId, title } | order(publishedAt desc)`
  );
  console.log(`  total: ${tagged.length}`);
  tagged.slice(0, 8).forEach((v, i) => console.log(`  ${i+1}. ${v.title}`));
}
main().catch(console.error);
