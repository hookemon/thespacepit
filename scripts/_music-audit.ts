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
  // Releases broken down by what audio they have
  const rows = await s.fetch<{ _id: string; title: string; slug: string; bandcampUrl?: string; tracklistCount: number; tracksWithPreview: number }[]>(`
    *[_type == "release" && withdrawn != true]{
      _id, title, "slug": slug.current, bandcampUrl,
      "tracklistCount": count(tracklist),
      "tracksWithPreview": count(tracklist[defined(audioPreviewUrl)])
    } | order(tracksWithPreview desc, tracklistCount desc)
  `);
  let withAudio = 0, partial = 0, hasBcNoAudio = 0, noBc = 0;
  console.log("=== releases by audio status ===\n");
  for (const r of rows) {
    if (r.tracksWithPreview > 0 && r.tracksWithPreview === r.tracklistCount) withAudio++;
    else if (r.tracksWithPreview > 0) partial++;
    else if (r.bandcampUrl) hasBcNoAudio++;
    else noBc++;
  }
  console.log(`✅ fully wired (every track has preview):  ${withAudio}`);
  console.log(`◐  partial (some tracks have preview):      ${partial}`);
  console.log(`◑  has bandcampUrl but no previews:         ${hasBcNoAudio}`);
  console.log(`◔  no bandcampUrl, no audio:                ${noBc}`);
  console.log(`\n=== first 8 fully wired (your "50 backwoods" cohort) ===`);
  for (const r of rows.filter(r => r.tracksWithPreview > 0 && r.tracksWithPreview === r.tracklistCount).slice(0, 8)) {
    console.log(`  ${r.tracksWithPreview}/${r.tracklistCount}  ${r.title}  (${r.slug})`);
  }
  console.log(`\n=== releases WITH bandcampUrl, MISSING audio (scrape these next) ===`);
  for (const r of rows.filter(r => r.bandcampUrl && r.tracksWithPreview === 0 && r.tracklistCount > 0).slice(0, 15)) {
    console.log(`  ${r.tracklistCount} tracks  ${r.title}  →  ${r.bandcampUrl}`);
  }
  console.log(`\n=== 50 backwoods (verify) ===`);
  const fifty = rows.find(r => r.title.toLowerCase().includes("backwoods") || r.slug.includes("backwoods"));
  console.log(fifty ?? "not found");
}
main().catch(console.error);
