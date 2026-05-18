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

const PLATFORMS = [
  "bandcampUrl",
  "spotifyUrl",
  "appleMusicUrl",
  "youtubeUrl",
  "youtubeMusicUrl",
  "tidalUrl",
  "amazonMusicUrl",
  "deezerUrl",
  "soundcloudUrl",
] as const;

(async () => {
  const rows = await c.fetch<Array<Record<string, unknown>>>(`
    *[_type == "release" && (withdrawn != true)] | order(year desc, catalogNumber desc) {
      _id, title, catalogNumber, year, label,
      ${PLATFORMS.map((p) => `"${p}": defined(${p})`).join(", ")}
    }
  `);

  const counts: Record<string, number> = Object.fromEntries(PLATFORMS.map((p) => [p, 0]));
  for (const r of rows) for (const p of PLATFORMS) if (r[p]) counts[p] += 1;

  console.log(`Total releases (not withdrawn): ${rows.length}\n`);
  console.log("Platform coverage:");
  for (const p of PLATFORMS) {
    const pct = ((counts[p] / rows.length) * 100).toFixed(0);
    const bar = "█".repeat(Math.round(counts[p] / rows.length * 30));
    console.log(`  ${p.replace("Url", "").padEnd(14)} ${String(counts[p]).padStart(3)}/${rows.length}  ${pct.padStart(3)}%  ${bar}`);
  }

  // Releases with ZERO platform links — the worst offenders
  const empty = rows.filter((r) => PLATFORMS.every((p) => !r[p]));
  console.log(`\n⚠ ${empty.length} releases with NO platform URLs at all:`);
  for (const r of empty.slice(0, 15)) {
    console.log(`   ${(r.catalogNumber as string ?? "—").padEnd(8)} ${r.title} (${r.year ?? "?"})`);
  }
  if (empty.length > 15) console.log(`   …and ${empty.length - 15} more`);
})();
