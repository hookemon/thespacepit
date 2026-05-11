/**
 * Audit which releases have tracklist and credits populated.
 * Output: per-release coverage matrix + totals by label.
 */
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

(async () => {
  const rows = await c.fetch<any[]>(`
    *[_type == "release" && (withdrawn != true)]
      | order(label asc, catalogNumber asc) {
      _id, title, label, catalogNumber,
      "trackCount": count(tracklist),
      "creditCount": count(credits),
      bandcampUrl, spotifyUrl
    }
  `);

  const byLabel = new Map<string, { total: number; withTracks: number; withCredits: number; either: number; rows: any[] }>();
  for (const r of rows) {
    const label = r.label || "(none)";
    if (!byLabel.has(label)) byLabel.set(label, { total: 0, withTracks: 0, withCredits: 0, either: 0, rows: [] });
    const b = byLabel.get(label)!;
    b.total++;
    if (r.trackCount > 0) b.withTracks++;
    if (r.creditCount > 0) b.withCredits++;
    if (r.trackCount > 0 || r.creditCount > 0) b.either++;
    b.rows.push(r);
  }

  console.log("\n📋 Tracklist + credits coverage by label\n");
  console.log("LABEL".padEnd(45), "TOTAL".padStart(6), "TRX".padStart(6), "CRD".padStart(6), "EITHER".padStart(8));
  console.log("-".repeat(75));
  for (const [label, b] of [...byLabel.entries()].sort()) {
    console.log(label.padEnd(45), String(b.total).padStart(6), String(b.withTracks).padStart(6), String(b.withCredits).padStart(6), String(b.either).padStart(8));
  }

  console.log("\n\n🔎 Releases MISSING tracklist (top 60):\n");
  const missing = rows.filter(r => !r.trackCount || r.trackCount === 0);
  for (const r of missing.slice(0, 60)) {
    const links = [r.bandcampUrl ? "BC" : null, r.spotifyUrl ? "SP" : null].filter(Boolean).join("/");
    console.log(`  • [${r.label || "—"}] ${r.catalogNumber || "—".padEnd(8)}  ${r.title}  ${links ? `(${links})` : "(no links)"}`);
  }
  console.log(`\n... ${missing.length} total missing tracklist`);
})();
