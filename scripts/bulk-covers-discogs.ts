/**
 * Fourth-pass cover fetcher — pulls cover art directly from Discogs for any
 * release whose Sanity _id is `release-discogs-<discogs-release-id>`.
 *
 * Discogs has the broadest catalog of physical-media / underground / 12"
 * white-label stuff that iTunes and MusicBrainz miss. Their API returns
 * an `images` array per release; we grab the primary `uri`.
 *
 * Requires DISCOGS_TOKEN in .env.local (you already have one — your
 * import-discogs.ts uses it).
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN ?? "";
const UA = "spacepit-web/1.0 +https://thespacepit.com";

type Release = { _id: string; title: string; artistNames: string[] };

type DiscogsImage = { type?: string; uri?: string; uri150?: string };
type DiscogsRelease = { images?: DiscogsImage[] };

async function fetchDiscogsCover(discogsId: string): Promise<string | null> {
  const url = `https://api.discogs.com/releases/${discogsId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        ...(DISCOGS_TOKEN ? { authorization: `Discogs token=${DISCOGS_TOKEN}` } : {}),
      },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as DiscogsRelease;
    // Prefer the "primary" image, then anything else.
    const primary = d.images?.find((i) => i.type === "primary");
    const first = d.images?.[0];
    return primary?.uri ?? first?.uri ?? null;
  } catch {
    return null;
  }
}

async function uploadFromUrl(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await sanity.assets.upload("image", buf, { filename });
    return asset._id;
  } catch {
    return null;
  }
}

async function main() {
  // Anything missing a cover whose _id encodes a Discogs release id.
  const rows = await sanity.fetch<Release[]>(`
    *[_type == "release" && (withdrawn != true) && !defined(cover)
        && _id match "release-discogs-*"]
      | order(year desc) {
      _id, title,
      "artistNames": artists[]->name
    }
  `);
  console.log(`🎨 ${rows.length} discogs-keyed releases without covers\n`);

  let ok = 0;
  let miss = 0;
  for (const r of rows) {
    const discogsId = r._id.replace("release-discogs-", "");
    const label = `${(r.artistNames ?? [])[0] ?? "?"} — ${r.title}`.slice(0, 60).padEnd(60);
    process.stdout.write(`  ${label} `);
    const coverUrl = await fetchDiscogsCover(discogsId);
    if (!coverUrl) {
      console.log("✗ no image on discogs");
      miss += 1;
      await new Promise((res) => setTimeout(res, 1100));
      continue;
    }
    const assetId = await uploadFromUrl(coverUrl, `${r._id}-cover.jpg`);
    if (!assetId) {
      console.log("✗ upload failed");
      miss += 1;
      await new Promise((res) => setTimeout(res, 1100));
      continue;
    }
    await sanity.patch(r._id).set({
      cover: { _type: "image", asset: { _type: "reference", _ref: assetId } },
    }).commit();
    console.log("✓");
    ok += 1;
    // Discogs rate-limits to 60 req/min for authed clients.
    await new Promise((res) => setTimeout(res, 1100));
  }

  console.log(`\n✅ ${ok} discogs covers · ${miss} still missing`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
