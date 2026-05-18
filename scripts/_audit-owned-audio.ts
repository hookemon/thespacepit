import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const OWNED_LABELS = [
  "Calm + Collect",
  "Calm + Collect Instrumental",
  "Lockhart Dynasty × Calm + Collect",
];

(async () => {
  // 1. all distinct labels for context
  const labels = await c.fetch<string[]>(
    `array::unique(*[_type == "release" && defined(label)].label)`
  );
  console.log("All distinct labels in catalog:");
  labels.sort().forEach((l) => console.log(`  · ${l}`));
  console.log();

  // 2. owned releases — coverage
  const owned = await c.fetch<Array<{
    _id: string;
    title: string;
    catalogNumber?: string;
    label?: string;
    status?: string;
    bandcampUrl?: string;
    trackCount: number;
    tracksWithPreview: number;
    hasPromoAudio: boolean;
  }>>(`
    *[_type == "release" && label in $labels && (withdrawn != true)]
      | order(label asc, catalogNumber asc) {
      _id, title, catalogNumber, label, status, bandcampUrl,
      "trackCount": count(tracklist),
      "tracksWithPreview": count(tracklist[defined(audioPreviewUrl)]),
      "hasPromoAudio": defined(promoAudio.asset)
    }
  `, { labels: OWNED_LABELS });

  console.log(`Owned releases (${OWNED_LABELS.join(", ")}): ${owned.length}\n`);

  const ready = owned.filter(r => r.trackCount > 0 && r.tracksWithPreview === r.trackCount);
  const partial = owned.filter(r => r.trackCount > 0 && r.tracksWithPreview > 0 && r.tracksWithPreview < r.trackCount);
  const noPreview = owned.filter(r => r.trackCount > 0 && r.tracksWithPreview === 0);
  const noTracks = owned.filter(r => r.trackCount === 0);

  console.log(`✓ Fully covered (all tracks streamable):   ${ready.length}`);
  console.log(`◐ Partial (some tracks missing audio):     ${partial.length}`);
  console.log(`✗ No track-level audio yet:                ${noPreview.length}`);
  console.log(`— No tracklist at all:                     ${noTracks.length}\n`);

  if (noPreview.length > 0) {
    console.log("Releases needing audio scrape (have tracks, no previews):");
    for (const r of noPreview.slice(0, 30)) {
      const bc = r.bandcampUrl ? "📀 BC" : "  —  ";
      const status = (r.status ?? "?").padEnd(8);
      console.log(`   ${bc}  ${status}  ${(r.catalogNumber ?? "—").padEnd(8)}  ${r.title}  (${r.trackCount} tracks)`);
    }
    if (noPreview.length > 30) console.log(`   …and ${noPreview.length - 30} more`);
  }

  // releases with bandcampUrl but no tracks scraped — these are the easy wins
  const easyWins = owned.filter(r => r.bandcampUrl && r.trackCount > 0 && r.tracksWithPreview === 0);
  console.log(`\n🎯 Easy wins (has bandcampUrl, has tracks, no audio yet): ${easyWins.length}`);
})();
