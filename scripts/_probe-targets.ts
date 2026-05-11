import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
const s = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
async function main() {
  console.log("=== L-vis releases (search by artist ref) ===");
  console.log(await s.fetch(`*[_type == "release" && references("artist-ext-l-vis-1990")]{ _id, title, "slug": slug.current, year }`));
  console.log("\n=== releases w/ Neon Dreams / Lvis ===");
  console.log(await s.fetch(`*[_type == "release" && (title match "*Neon*" || title match "*L-vis*" || title match "*Lvis*")]{ _id, title, "slug": slug.current, year }`));

  // Fetch the playlist titles from YouTube to identify "1320"
  const KEY = process.env.YOUTUBE_API_KEY!;
  const ids = [
    "PLMXEKDUSbulM2FrBcutFsBqwksfTm6XeP",
    "PLMXEKDUSbulNGNaAvzZjp68vInUuoI1VR",
    "PLMXEKDUSbulMwBNNlD9KLJeLiMh9VWqRS",
    "PLMXEKDUSbulNhfhzN8iRZdYiHrHhgC0D4",
  ];
  console.log("\n=== playlist titles ===");
  for (const id of ids) {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${id}&key=${KEY}`;
    const res = await fetch(url);
    const d = await res.json() as { items: { snippet: { title: string; description?: string } }[] };
    console.log(`  ${id}: "${d.items[0]?.snippet?.title}"`);
  }

  // Get the title for the single video too
  const vid = "fmXkMX07GhQ";
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${vid}&key=${KEY}`);
  const dv = await r.json() as { items: { snippet: { title: string } }[] };
  console.log(`\n=== single video ===\n  ${vid}: "${dv.items[0]?.snippet?.title}"`);
}
main().catch(console.error);
