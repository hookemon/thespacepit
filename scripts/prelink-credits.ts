/**
 * Pre-link the obvious credits across the C+C catalog:
 *   · Tiombe Lockhart   — vocals on every Cubic Zirconia (LDCC) release
 *   · Todd Weinstock    — programming on the LDCC releases (per MWC + CZ lineup)
 *   · Gareth Jones      — mix on every Spiritual Friendship release
 *
 * Idempotent — won't add a credit if one already exists for that person+role.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function artistId(slug: string): Promise<string | null> {
  const r = await client.fetch<{ _id: string } | null>(
    `*[_type == "artist" && slug.current == $slug][0]{ _id }`,
    { slug }
  );
  return r?._id ?? null;
}

type CreditExistingShape = { person?: { _ref?: string }; role?: string };

async function addCredit(releaseId: string, personId: string, role: string): Promise<"added" | "exists"> {
  const existing = await client.fetch<CreditExistingShape[] | null>(
    `*[_id == $id][0].credits[]{ "person": person, role }`,
    { id: releaseId }
  );
  for (const c of existing ?? []) {
    if (c?.person?._ref === personId && c.role?.toLowerCase() === role.toLowerCase()) {
      return "exists";
    }
  }
  await client
    .patch(releaseId)
    .setIfMissing({ credits: [] })
    .append("credits", [
      {
        _type: "object",
        _key: `c-${personId.slice(-6)}-${Date.now()}`,
        role,
        person: { _type: "reference", _ref: personId },
      },
    ])
    .commit({ autoGenerateArrayKeys: true });
  return "added";
}

async function releasesWithLabel(label: string): Promise<{ _id: string; title: string }[]> {
  return client.fetch(
    `*[_type == "release" && label == $label && (withdrawn != true)] | order(catalogNumber asc){
       _id, title
     }`,
    { label }
  );
}

async function releasesWithArtist(slug: string): Promise<{ _id: string; title: string }[]> {
  return client.fetch(
    `*[_type == "release" && $slug in artists[]->slug.current && (withdrawn != true)]{
       _id, title
     }`,
    { slug }
  );
}

async function main() {
  const tiombe = await artistId("tiombe-lockhart");
  const todd = await artistId("todd-weinstock");
  const gareth = await artistId("gareth-jones");
  const nick = await artistId("nick-hook");

  if (!tiombe || !todd || !gareth || !nick) {
    console.error("Missing one of the key artist docs. Run seed first.");
    console.error({ tiombe, todd, gareth, nick });
    process.exit(1);
  }

  // === Cubic Zirconia (LDCC) — Tiombe vocals, Todd programming ===
  const ldcc = await releasesWithLabel("Lockhart Dynasty × Calm + Collect");
  console.log(`\n📀 Cubic Zirconia / LDCC — ${ldcc.length} releases`);
  let count = 0;
  for (const r of ldcc) {
    const v = await addCredit(r._id, tiombe, "vocals");
    const p = await addCredit(r._id, todd, "programming + keys");
    const added = [v === "added" && "Tiombe vocals", p === "added" && "Todd programming"].filter(Boolean);
    if (added.length) {
      console.log(`  ✓ ${r.title} — +${added.join(", +")}`);
      count += added.length;
    } else {
      console.log(`  · ${r.title} — already credited`);
    }
  }
  console.log(`  → ${count} new credits added to LDCC catalog`);

  // === Spiritual Friendship — Gareth mix ===
  const sfReleases = await releasesWithArtist("spiritual-friendship");
  console.log(`\n📀 Spiritual Friendship — ${sfReleases.length} releases`);
  let sfCount = 0;
  for (const r of sfReleases) {
    const v = await addCredit(r._id, gareth, "mix");
    if (v === "added") {
      console.log(`  ✓ ${r.title} — +Gareth mix`);
      sfCount += 1;
    } else {
      console.log(`  · ${r.title} — already credited`);
    }
  }
  console.log(`  → ${sfCount} new credits added to SF catalog`);

  console.log(`\n✅ done — ${count + sfCount} new credits total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
