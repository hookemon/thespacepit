/**
 * Seed the one Mixcloud mix Nick has uploaded directly to his account.
 * Reposts aren't returned by Mixcloud's public API; future mixes get added
 * via /studio after he uploads them to nickhook.mixcloud.com.
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

const MIXCLOUD_USER = "nickhook";

type Cloudcast = {
  key: string;
  url: string;
  name: string;
  slug: string;
  created_time: string;
  audio_length?: number;
  pictures?: { large?: string; "640wx640h"?: string };
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function uploadCover(coverUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename,
      contentType: "image/jpeg",
    });
    return asset._id;
  } catch (err) {
    console.warn(`cover upload failed: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log(`\n🎚  Pulling cloudcasts from /${MIXCLOUD_USER}/...`);
  const res = await fetch(`https://api.mixcloud.com/${MIXCLOUD_USER}/cloudcasts/?limit=50`);
  const data = (await res.json()) as { data: Cloudcast[] };
  const casts = data.data ?? [];
  console.log(`Found ${casts.length} mix${casts.length === 1 ? "" : "es"}.\n`);

  for (const c of casts) {
    console.log(`Patching ${c.slug}...`);
    const coverUrl = c.pictures?.["640wx640h"] ?? c.pictures?.large;
    let coverAssetId: string | null = null;
    if (coverUrl) {
      coverAssetId = await uploadCover(coverUrl, `${c.slug}.jpg`);
    }
    const _id = `mix-${c.slug}`;
    await client.createOrReplace({
      _id,
      _type: "mix",
      title: c.name,
      slug: { _type: "slug", current: c.slug },
      mixcloudUrl: c.url,
      date: c.created_time.slice(0, 10),
      duration: c.audio_length ? formatDuration(c.audio_length) : undefined,
      featured: true,
      ...(coverAssetId && {
        cover: { _type: "image", asset: { _type: "reference", _ref: coverAssetId } },
      }),
    });
    console.log(`  ✓ ${c.name} (${c.created_time.slice(0, 10)})`);
  }

  console.log(`\n✅ Done. Visit /mixes to see them.`);
}

main().catch((err) => {
  console.error("\n❌ Mix seed failed:", err);
  process.exit(1);
});
