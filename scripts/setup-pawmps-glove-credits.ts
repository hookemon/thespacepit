/**
 * Wire Pawmps + Gangsta Boo as PRIMARY artists on "If The Glove Don't Fit"
 * (currently only Nick Hook is primary; the others are in the title text).
 *
 * Steps:
 *   1. Create artist-pawmps if missing
 *   2. Patch release-nick-hook-boo-pawmps-glove.artists[] to include all 3
 *      as equal primary references — surfaces clickable name chips on the
 *      release page hero ("NICK HOOK · GANGSTA BOO · PAWMPS")
 *
 * Run: npx tsx scripts/setup-pawmps-glove-credits.ts
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

const PAWMPS_ID = "artist-pawmps";
const GLOVE_ID = "release-nick-hook-boo-pawmps-glove";

async function main() {
  // 1. Create Pawmps artist doc (idempotent)
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_id == $id][0]{ _id }`,
    { id: PAWMPS_ID },
  );
  if (!existing) {
    await client.createOrReplace({
      _id: PAWMPS_ID,
      _type: "artist",
      name: "Pawmps",
      slug: { _type: "slug", current: "pawmps" },
      tagline: "Co-billed on 'If The Glove Don't Fit' with Nick Hook + Gangsta Boo.",
      onLabel: false,
    });
    console.log(`✓ created ${PAWMPS_ID}`);
  } else {
    console.log(`  ↳ ${PAWMPS_ID} already exists`);
  }

  // 2. Patch the Glove release: 3 primary artists, equal billing.
  await client
    .patch(GLOVE_ID)
    .set({
      artists: [
        { _key: randomUUID(), _type: "reference", _ref: "artist-nick-hook" },
        { _key: randomUUID(), _type: "reference", _ref: "artist-gangsta-boo" },
        { _key: randomUUID(), _type: "reference", _ref: PAWMPS_ID },
      ],
      // Refresh the tagline to match the new co-billed framing.
      tagline:
        "Nick Hook + Gangsta Boo + Pawmps. The OJ-verdict callback. QOQEQA hyper-merengue remix on the B-side. Dropping August 2026.",
    })
    .commit();
  console.log(`✓ ${GLOVE_ID}.artists = [nick-hook, gangsta-boo, pawmps]`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
