import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  const r = await c.fetch(`*[_type == "release" && (slug.current == "clm007-throat" || slug.current == "cc017-50-backwoods")]{
    _id, title, "slug": slug.current,
    bandcampUrl, bandcampAlbumId, bandcampTrackId, youtubeUrl, spotifyUrl, soundcloudUrl,
    "trackCount": count(tracklist),
    "tracksWithVideo": count(tracklist[defined(videoUrl)])
  }`);
  console.log(JSON.stringify(r, null, 2));
})();
