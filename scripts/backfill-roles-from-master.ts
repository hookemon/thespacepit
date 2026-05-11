/**
 * Read the master discog spreadsheet, aggregate Nick's roles per album, then
 * credit him on every matching release in Sanity with his actual role(s).
 *
 * Per-track roles from the spreadsheet (col 17) like:
 *   "Artist, Member"
 *   "Mixer, Producer, Writer"
 *   "Co-Producer (additional)"
 *   "Engineer, Mixer"
 * get parsed and mapped to our schema's role enum, deduped per album.
 *
 * Idempotent — skips credits Nick already has.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve as resolvePath } from "path";

config({ path: resolvePath(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Map a raw spreadsheet role token to our display role.
function mapRole(token: string): string | null {
  const t = token.toLowerCase().trim();
  if (!t) return null;
  if (t.startsWith("artist") || t === "member") return null; // primary artist — handled separately
  if (t.startsWith("executive prod")) return "Executive producer";
  if (t.startsWith("co-prod") || t.startsWith("coprod")) return "Co-produced by";
  if (t.startsWith("co-mix") || t.startsWith("comix")) return "Co-mixed by";
  if (t === "producer" || t === "producer (additional)") return "Produced by";
  if (t === "mixer" || t === "mixing engineer") return "Mixed by";
  if (t === "engineer") return "Recorded by";
  if (t === "composer" || t === "writer") return "Written by";
  if (t === "remixer") return "Remix";
  if (t === "performer") return "Guest appearance";
  if (t === "programmer" || t.startsWith("programing") || t.startsWith("programming")) return "Programming";
  if (t === "keys") return "Keys";
  return null;
}

// "Mixer, Producer, Writer" → ["Mixed by", "Produced by", "Written by"]
function parseRoles(raw: string): string[] {
  if (!raw) return [];
  // Strip parenthetical notes like "(w/ Leon Kelly)".
  const cleaned = raw.replace(/\([^)]*\)/g, "");
  return [...new Set(cleaned.split(",").map((t) => mapRole(t)).filter((r): r is string => !!r))];
}

type MasterRow = {
  title: string;       // track title (col 2)
  album: string;       // album title (col 3)
  artist: string;      // artist (col 1)
  year: number;
  role: string;
};

async function loadMasterRows(): Promise<MasterRow[]> {
  // Parse via python helper since openpyxl isn't a node dep.
  const { execSync } = await import("child_process");
  const py = `
import openpyxl, json, re, sys
wb = openpyxl.load_workbook("/Users/nickhook/Library/CloudStorage/Dropbox/My Mac (Mac-mini)/Downloads/NICK HOOK ENTIRE DISCOGRAPHY 2.0 (2).xlsx", data_only=True)
ws = wb.active
out = []
for r in list(ws.iter_rows(values_only=True))[1:]:
    if not r[0]: continue
    m = re.match(r"(\\d{4})", str(r[0]))
    if not m: continue
    out.append({
      "title": str(r[2] or "").strip(),
      "album": str(r[3] or "").strip(),
      "artist": str(r[1] or "").strip(),
      "year": int(m.group(1)),
      "role": str(r[17] or "").strip(),
    })
print(json.dumps(out))
`;
  const json = execSync(`python3 -c '${py.replace(/'/g, "'\\''")}'`, { maxBuffer: 50 * 1024 * 1024 }).toString();
  return JSON.parse(json) as MasterRow[];
}

async function main() {
  const rows = await loadMasterRows();
  console.log(`📚 ${rows.length} rows from master spreadsheet`);

  // Aggregate roles per (album, year) — set of distinct display roles.
  const albumRoles = new Map<string, { album: string; year: number; artist: string; roles: Set<string> }>();
  for (const r of rows) {
    if (!r.album) continue;
    const key = `${norm(r.album)}|${r.year}`;
    const bucket = albumRoles.get(key) ?? { album: r.album, year: r.year, artist: r.artist, roles: new Set<string>() };
    for (const role of parseRoles(r.role)) bucket.roles.add(role);
    albumRoles.set(key, bucket);
  }
  console.log(`📀 ${albumRoles.size} distinct (album, year) groups\n`);

  const nick = await client.fetch<{ _id: string }>(`*[_type == "artist" && slug.current == "nick-hook"][0]{ _id }`);
  if (!nick) { console.error("nick-hook not found"); process.exit(1); }

  // Load all Sanity releases with their existing credits so we can dedupe.
  const sanityReleases = await client.fetch<{ _id: string; title: string; year?: number; credits?: { person?: { _ref?: string }; role?: string }[] }[]>(`
    *[_type == "release" && defined(year)]{
      _id, title, year,
      "credits": credits[]{ "person": person, role }
    }
  `);

  // Index Sanity releases by normTitle.
  const sanityByKey = new Map<string, typeof sanityReleases[number]>();
  for (const r of sanityReleases) {
    sanityByKey.set(`${norm(r.title)}|${r.year ?? ""}`, r);
  }

  // For each album in the master, find the matching Sanity release and patch credits.
  let added = 0;
  let unmatched = 0;
  const unmatchedList: string[] = [];
  for (const [, bucket] of albumRoles) {
    if (bucket.roles.size === 0) continue;
    // Try exact match, then ±2 year window, then with common suffixes stripped.
    let hit: (typeof sanityReleases)[number] | undefined;
    for (const dy of [0, -1, 1, -2, 2]) {
      hit = sanityByKey.get(`${norm(bucket.album)}|${bucket.year + dy}`);
      if (hit) break;
      // Strip suffixes
      const stripped = norm(bucket.album).replace(/(lp|ep|single|remixes|mixtape|edition|extended)$/, "");
      hit = sanityByKey.get(`${stripped}|${bucket.year + dy}`);
      if (hit) break;
    }
    if (!hit) {
      unmatched += 1;
      unmatchedList.push(`${bucket.year} · ${bucket.album} (${[...bucket.roles].join(", ")})`);
      continue;
    }

    const existingRoles = new Set(
      (hit.credits ?? [])
        .filter((c) => c.person?._ref === nick._id)
        .map((c) => (c.role ?? "").toLowerCase())
    );
    const toAdd = [...bucket.roles].filter((r) => !existingRoles.has(r.toLowerCase()));
    if (toAdd.length === 0) continue;

    const newCredits = toAdd.map((role, i) => ({
      _type: "object",
      _key: `c-nick-master-${i}-${Date.now()}`,
      role,
      person: { _type: "reference", _ref: nick._id },
    }));
    await client.patch(hit._id)
      .setIfMissing({ credits: [] })
      .append("credits", newCredits)
      .commit({ autoGenerateArrayKeys: true });
    console.log(`  ✓ ${hit.title.slice(0, 40).padEnd(40)} +${toAdd.join(" +")}`);
    added += toAdd.length;
  }

  console.log(`\n✅ ${added} credits added to existing releases`);
  if (unmatched > 0) {
    console.log(`\n⚠ ${unmatched} master entries could not be matched to a Sanity release:`);
    for (const u of unmatchedList.slice(0, 20)) console.log(`    ${u}`);
    if (unmatchedList.length > 20) console.log(`    … and ${unmatchedList.length - 20} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
