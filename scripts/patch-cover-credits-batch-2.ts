/**
 * Patch in the cover-art credits that were ambiguous in the first batch:
 *
 *   · CC023 iV         → Cover art: Gareth Jones (watercolor)
 *   · LAZARO (Yoga Fire) → Photography: Nick Hook
 *   · CC016 Can't Tell Me Nothing → Photography: Nick Hook
 *   · CC014 Head (21 Savage) → Cover art: James (graffiti — name only, no
 *                              artist doc yet)
 *   · ext-fuck-work (CZ) → Cover art: Mike Davis
 *
 * Idempotent: checks the existing credits[] and skips if a matching role +
 * person credit is already there.
 *
 * Run: npx tsx scripts/patch-cover-credits-batch-2.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

type Credit = {
  role: string;
  /** Sanity artist doc id; omit for name-only credits. */
  personRef?: string;
  /** Free-text name fallback when no artist doc exists. */
  name?: string;
  /** Optional detail e.g. "watercolor", "graffiti". */
  instrument?: string;
};

type Patch = {
  releaseId: string;
  releaseLabel: string;
  credits: Credit[];
};

const PATCHES: Patch[] = [
  {
    releaseId: "release-cc023-iv",
    releaseLabel: "CC023 iV (Spiritual Friendship 4)",
    credits: [
      { role: "Cover art", personRef: "artist-gareth-jones", instrument: "watercolor" },
    ],
  },
  {
    releaseId: "release-ext-lazaro",
    releaseLabel: "LAZARO (Yoga Fire)",
    credits: [{ role: "Photography", personRef: "artist-nick-hook" }],
  },
  {
    releaseId: "release-cc016-cant-tell-me-nothing-remixes",
    releaseLabel: "CC016 Can't Tell Me Nothing (+ Remixes)",
    credits: [{ role: "Photography", personRef: "artist-nick-hook" }],
  },
  {
    releaseId: "release-cc014-head",
    releaseLabel: "CC014 Head (21 Savage)",
    credits: [{ role: "Cover art", name: "James", instrument: "graffiti" }],
  },
  {
    releaseId: "release-ext-fuck-work",
    releaseLabel: "Cubic Zirconia — Fuck Work",
    credits: [
      { role: "Cover art", personRef: "artist-cover-mike-davis" },
    ],
  },
];

function creditExists(
  existing: Array<{
    role?: string;
    person?: { _ref?: string };
    name?: string;
  }>,
  c: Credit,
): boolean {
  return existing.some((e) => {
    if (e.role !== c.role) return false;
    if (c.personRef) return e.person?._ref === c.personRef;
    if (c.name) return (e.name ?? "").toLowerCase() === c.name.toLowerCase();
    return false;
  });
}

async function main() {
  for (const p of PATCHES) {
    const doc = await client.fetch<{
      _id: string;
      credits?: Array<{
        role?: string;
        person?: { _ref?: string };
        name?: string;
      }>;
    } | null>(`*[_id == $id][0]{ _id, credits }`, { id: p.releaseId });
    if (!doc) {
      console.log(`✗ NOT FOUND: ${p.releaseId}`);
      continue;
    }
    const existing = doc.credits ?? [];
    const toAdd: Array<Record<string, unknown>> = [];
    for (const c of p.credits) {
      if (creditExists(existing, c)) {
        console.log(`  ↳ skip (already present): ${p.releaseLabel} :: ${c.role} ${c.personRef ?? c.name}`);
        continue;
      }
      const entry: Record<string, unknown> = {
        _key: randomUUID(),
        _type: "object",
        role: c.role,
      };
      if (c.personRef) entry.person = { _type: "reference", _ref: c.personRef };
      if (c.name) entry.name = c.name;
      if (c.instrument) entry.instrument = c.instrument;
      toAdd.push(entry);
    }
    if (toAdd.length === 0) continue;
    await client
      .patch(p.releaseId)
      .setIfMissing({ credits: [] })
      .append("credits", toAdd)
      .commit();
    console.log(`✓ ${p.releaseLabel}: +${toAdd.length} credit(s)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
