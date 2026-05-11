/**
 * Seed Mix docs from a list of Mixcloud URLs (guest spots, label mixes,
 * radio shows etc. that live on other people's accounts). For each URL we
 * fetch Mixcloud's API to get title, date, cover, duration.
 *
 * Run: npx tsx scripts/seed-mix-urls.ts
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

// Mix URLs Nick has been on — guest spots, label mixes, radio shows.
const MIX_URLS: string[] = [
  "https://www.mixcloud.com/CalmCollect/taso-nick-hook-jungle-juice-v1/",
  "https://www.mixcloud.com/Solid_Steel/solid-steel-radio-show-1042015-part-1-2-nick-hook/",
  "https://www.mixcloud.com/boxoutfm/guest-mix-349-nick-hook-06-07-2019/",
  "https://www.mixcloud.com/DiploandFriends/diplo-friends-on-bbc-radio-1-ft-nick-hook-dj-shadow-111013/",
  "https://www.mixcloud.com/boxoutfm/boxout-wednesdays-1452-nick-hook-29-01-2020/",
  "https://www.mixcloud.com/boxoutfm/experimental-hour-032-nick-hook-30-05-2019/",
  "https://www.mixcloud.com/Serato/seratocast-mix-71-nick-hook-dj-earl/",
  "https://www.mixcloud.com/NTSRadio/nick-hook-19th-december-2016/",
  "https://www.mixcloud.com/majestic_mood/groove-merchants-radio-x-nick-hook-lucky-me-xlr8r/",
  "https://www.mixcloud.com/NTSRadio/the-monolith-w-pbdy-nick-hook-miguel-atwood-ferguson-12th-december-2017/",
  "https://www.mixcloud.com/L_A_B_O_R/perfume-01-nick-hook/",
];

type Cloudcast = {
  key: string;
  url: string;
  name: string;
  slug: string;
  created_time: string;
  audio_length?: number;
  pictures?: { large?: string; "640wx640h"?: string };
  user?: { username?: string };
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function urlToApiPath(url: string): string {
  // https://www.mixcloud.com/USER/SLUG/  →  /USER/SLUG/
  const u = new URL(url);
  let p = u.pathname;
  if (!p.endsWith("/")) p += "/";
  return p;
}

function deriveEra(username: string | undefined, year: number): string {
  // Lightweight era hint: pair the host account with the year.
  const host = username?.toLowerCase() ?? "";
  if (host === "calmcollect") return `calm + collect · ${year}`;
  if (host === "ntsradio") return `nts radio · ${year}`;
  if (host === "solid_steel") return `solid steel · ${year}`;
  if (host === "boxoutfm") return `boxout fm · ${year}`;
  if (host === "diploandfriends") return `diplo & friends · bbc r1 · ${year}`;
  if (host === "serato") return `seratocast · ${year}`;
  if (host === "majestic_mood") return `groove merchants · xlr8r · ${year}`;
  if (host === "l_a_b_o_r") return `LABOR · ${year}`;
  return `${year}`;
}

// Slug for the Sanity doc — keep it unique across hosts by prefixing with the
// Mixcloud username (so two "experimental-hour-XXX" mixes from different hosts
// don't collide).
function buildLocalSlug(apiPath: string): string {
  // /USER/SLUG/ → user-slug
  const parts = apiPath.split("/").filter(Boolean);
  if (parts.length < 2) return apiPath.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `${parts[0]}-${parts[1]}`.toLowerCase();
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
    console.warn(`   ⚠️  cover upload failed: ${(err as Error).message}`);
    return null;
  }
}

async function patchOne(url: string, idx: number, total: number) {
  const apiPath = urlToApiPath(url);
  console.log(`\n[${idx + 1}/${total}] ${apiPath}`);
  const res = await fetch(`https://api.mixcloud.com${apiPath}`);
  if (!res.ok) {
    console.warn(`   ⚠️  API ${res.status} — skipping`);
    return;
  }
  const data = (await res.json()) as Cloudcast;
  const slug = buildLocalSlug(apiPath);
  const _id = `mix-${slug}`;
  const year = parseInt(data.created_time.slice(0, 4));
  const era = deriveEra(data.user?.username, year);
  const coverUrl = data.pictures?.["640wx640h"] ?? data.pictures?.large;
  let coverAssetId: string | null = null;
  if (coverUrl) {
    coverAssetId = await uploadCover(coverUrl, `${slug}.jpg`);
  }

  await client.createOrReplace({
    _id,
    _type: "mix",
    title: data.name,
    slug: { _type: "slug", current: slug },
    mixcloudUrl: data.url,
    date: data.created_time.slice(0, 10),
    duration: data.audio_length ? formatDuration(data.audio_length) : undefined,
    era,
    ...(coverAssetId && {
      cover: { _type: "image", asset: { _type: "reference", _ref: coverAssetId } },
    }),
  });
  console.log(`   ✓ ${data.name} (${data.created_time.slice(0, 10)}) · ${era}`);
}

async function main() {
  console.log(`\n🎚  Importing ${MIX_URLS.length} mixes from Mixcloud URLs...`);
  for (let i = 0; i < MIX_URLS.length; i++) {
    try {
      await patchOne(MIX_URLS[i], i, MIX_URLS.length);
    } catch (err) {
      console.error(`   ❌ ${MIX_URLS[i]} — ${(err as Error).message}`);
    }
  }
  console.log(`\n✅ Done. Reload /mixes to see them.`);
}

main();
