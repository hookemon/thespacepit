import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN!, useCdn: false });
(async () => {
  // Coverage of stream URLs across releases
  const r = await c.fetch(`*[_type == "release" && (withdrawn != true)]{
    _id, title, label,
    "hasBandcamp": defined(bandcampUrl) || defined(bandcampAlbumId) || defined(bandcampTrackId),
    "hasSpotify": defined(spotifyUrl),
    "hasYouTube": defined(youtubeUrl) || defined(youtubePlaylistId),
    "hasSoundcloud": defined(soundcloudUrl),
    "hasApple": defined(appleMusicUrl)
  }`);
  const total = r.length;
  const counts = {
    bandcamp: r.filter(x => x.hasBandcamp).length,
    spotify:  r.filter(x => x.hasSpotify).length,
    youtube:  r.filter(x => x.hasYouTube).length,
    apple:    r.filter(x => x.hasApple).length,
    soundcloud: r.filter(x => x.hasSoundcloud).length,
    none:     r.filter(x => !x.hasBandcamp && !x.hasSpotify && !x.hasYouTube && !x.hasApple && !x.hasSoundcloud).length,
  };
  console.log(`coverage across ${total} releases:`);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(12)} ${v}/${total}  ${"█".repeat(Math.round(v/total*30))}`);
  console.log("\nReleases with NO listen-source (need URLs):");
  const orphans = r.filter(x => !x.hasBandcamp && !x.hasSpotify && !x.hasYouTube);
  for (const x of orphans.slice(0, 25)) console.log(`  - ${x.title.padEnd(45)}  (${x.label || '-'})`);
  if (orphans.length > 25) console.log(`  ... and ${orphans.length - 25} more`);
})();
