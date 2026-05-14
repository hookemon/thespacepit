/* eslint-disable no-console */
/**
 * Reframe Old English release:
 *   · DJ Spinn + Nick Hook + Scatta VIP (third name = Scatta)
 *   · Bio: a VIP that's been played around the world, finally official on C+C
 *   · Credit order: Vocals → Produced by → Remix by → Mastered by → Recorded at
 *   · Audio: upload the M4A so the in-page PromoPlayer can stream it
 *
 * Run: npx tsx scripts/patch-old-english-vip.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const RELEASE_ID = "release-old-english-spinn-hook-remix";
const AUDIO_PATH = "/tmp/old-english-spinn-hook-scatta-vip.m4a";

async function main() {
  // 1. Scatta as an artist (so the cover credit + future linking works)
  await client.createIfNotExists({
    _id: "artist-ext-scatta",
    _type: "artist",
    name: "Scatta",
    slug: { _type: "slug", current: "scatta" },
  });
  console.log("✓ artist: Scatta");

  // 2. Upload the M4A as the release's promoAudio
  const buf = readFileSync(AUDIO_PATH);
  console.log(`→ uploading audio (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  const asset = await client.assets.upload("file", buf, {
    filename: "old-english-spinn-hook-scatta-remix.m4a",
    contentType: "audio/mp4",
  });
  console.log(`→ asset _id: ${asset._id}`);

  // 3. New bio — three blocks. VIP-in-the-wild → finally official.
  const notes = [
    {
      _key: "oe-vip-1",
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: "s1",
          _type: "span",
          text:
            "DJ Spinn, Nick Hook, and Scatta cut this footwork VIP of ",
          marks: [],
        },
        { _key: "s1b", _type: "span", text: "Old English", marks: ["em"] },
        {
          _key: "s1c",
          _type: "span",
          text:
            " years ago — Teklife engine room running under the 2014 Salva + Nick Hook beat with Young Thug, Freddie Gibbs, and A$AP Ferg on top.",
          marks: [],
        },
      ],
    },
    {
      _key: "oe-vip-2",
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: "s2",
          _type: "span",
          text:
            "It's been a live weapon since — played around the world without ever landing officially.",
          marks: [],
        },
      ],
    },
    {
      _key: "oe-vip-3",
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: "s3",
          _type: "span",
          text: "Calm + Collect is finally giving it a home.",
          marks: [],
        },
      ],
    },
  ];

  // 4. Credits in Nick's order:
  //    Vocals → Produced by → Remix by → Mastered by, then Recorded at below.
  //    One person per credit row; the page renderer groups by role and
  //    joins names with " + " on a single line per role.
  const credits = [
    // VOCALS
    { _key: "cr-vox-yt",    role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-young-thug" } },
    { _key: "cr-vox-fg",    role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-freddie-gibbs" } },
    { _key: "cr-vox-ferg",  role: "Vocals",       person: { _type: "reference", _ref: "artist-ext-a-ap-ferg" } },
    // PRODUCED BY (original 2014 beat)
    { _key: "cr-prod-salva", role: "Produced by", person: { _type: "reference", _ref: "artist-ext-salva" } },
    { _key: "cr-prod-nick",  role: "Produced by", person: { _type: "reference", _ref: "artist-nick-hook" } },
    // REMIX BY (the VIP — Spinn + Hook + Scatta)
    { _key: "cr-rmx-spinn",   role: "Remix by", person: { _type: "reference", _ref: "artist-ext-dj-spinn" } },
    { _key: "cr-rmx-nick",    role: "Remix by", person: { _type: "reference", _ref: "artist-nick-hook" } },
    { _key: "cr-rmx-scatta",  role: "Remix by", person: { _type: "reference", _ref: "artist-ext-scatta" } },
    // MASTERED BY
    { _key: "cr-master-joe",  role: "Mastered by", person: { _type: "reference", _ref: "artist-stub-joe-laporta" } },
    // RECORDED AT (locations, no person ref — name field only)
    { _key: "cr-rec-stank",    role: "Recorded at", name: "Stankonia · Atlanta" },
    { _key: "cr-rec-spacepit", role: "Recorded at", name: "thespacepit · Brooklyn" },
    { _key: "cr-rec-salva",    role: "Recorded at", name: "Salva Studio" },
  ];

  // 5. Patch the release: title (adds Scatta), tagline, notes, credits,
  //    promoAudio reference, and add Scatta to primary artists.
  await client
    .patch(RELEASE_ID)
    .set({
      title: "Old English (DJ Spinn + Nick Hook + Scatta Remix)",
      tagline:
        "the footwork VIP — played around the world for a decade. now officially on calm + collect.",
      notes,
      credits,
      promoAudio: {
        _type: "file",
        asset: { _type: "reference", _ref: asset._id },
      },
      artists: [
        { _key: "a-yt",     _type: "reference", _ref: "artist-ext-young-thug" },
        { _key: "a-fg",     _type: "reference", _ref: "artist-ext-freddie-gibbs" },
        { _key: "a-ferg",   _type: "reference", _ref: "artist-ext-a-ap-ferg" },
        { _key: "a-spinn",  _type: "reference", _ref: "artist-ext-dj-spinn" },
        { _key: "a-nick",   _type: "reference", _ref: "artist-nick-hook" },
        { _key: "a-scatta", _type: "reference", _ref: "artist-ext-scatta" },
      ],
    })
    .commit();
  console.log("✓ Old English release patched: title + tagline + bio + credits + audio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
