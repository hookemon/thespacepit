/**
 * Upload a folder of audio stems to Sanity, attach them to a release as the
 * stems[] array, and surface that release in the jam room.
 *
 * Edit RELEASE + STEMS_DIR below, then run.
 *
 * Idempotent — re-running uploads new asset versions but won't duplicate the
 * release doc; it overwrites the stems array each time.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve, basename } from "path";
import { readFileSync, readdirSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// ───────────────────────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────────────────────
const RELEASE = {
  _id: "release-an-honest-key",
  title: "An Honest Key",
  slug: "an-honest-key",
  feature: "Andy Bell",
  trackTitle: "An Honest Key (160 BPM)",
  tagline: "for adrian",
  label: "Calm + Collect",
};

const STEMS_DIR = "/tmp/an-honest-key";

// Per-stem visual settings — color cycles through if missing.
// Match by lowercase substring in the filename.
const STEM_STYLE: { matchSubstr: string; label: string; color: string }[] = [
  { matchSubstr: "bass",   label: "bass",   color: "#7BD3A8" },
  { matchSubstr: "percs",  label: "drums",  color: "#F2B705" },
  { matchSubstr: "synths", label: "synths", color: "#C9B9E8" },
  { matchSubstr: "vocal",  label: "vox",    color: "#E83A1C" },
];

const ANDY_BELL_ID = "artist-ext-andy-bell";

// ───────────────────────────────────────────────────────────────────────────

async function ensureArtist(id: string, name: string, slug: string) {
  await c.createIfNotExists({
    _id: id,
    _type: "artist",
    name,
    slug: { _type: "slug", current: slug },
    onLabel: false,
  });
}

(async () => {
  console.log(`\n🎚  uploading stems → ${RELEASE.title}\n`);

  // 1. Make sure the artists exist (Andy Bell + Nick Hook)
  await ensureArtist(ANDY_BELL_ID, "Andy Bell", "andy-bell");

  // 2. Upload each audio file as an asset
  const files = readdirSync(STEMS_DIR)
    .filter((f) => /\.(m4a|mp3|wav|aac|aiff)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`❌ no audio files in ${STEMS_DIR}`);
    process.exit(1);
  }

  console.log(`   found ${files.length} audio files`);

  const stems: any[] = [];
  for (const file of files) {
    const fullPath = `${STEMS_DIR}/${file}`;
    const buf = readFileSync(fullPath);
    const ext = file.split(".").pop()!.toLowerCase();
    const contentType = ext === "m4a" ? "audio/mp4"
      : ext === "mp3" ? "audio/mpeg"
      : ext === "wav" ? "audio/wav"
      : "audio/aac";

    process.stdout.write(`   uploading ${file} (${(buf.length / 1024 / 1024).toFixed(1)} MB)... `);
    const asset = await c.assets.upload("file", buf, {
      filename: file,
      contentType,
    });
    console.log(`✓ asset ${asset._id}`);

    // Pick a label/color from the style map, or fall back to the filename.
    const lower = file.toLowerCase();
    const style = STEM_STYLE.find((s) => lower.includes(s.matchSubstr));
    const label = style?.label ?? basename(file, `.${ext}`).toLowerCase();
    const color = style?.color;

    stems.push({
      _key: `stem-${stems.length}`,
      label,
      audio: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      ...(color ? { color } : {}),
    });
  }

  // 3. Create or upsert the release doc
  console.log(`\n   upserting release ${RELEASE._id}...`);
  await c.createIfNotExists({
    _id: RELEASE._id,
    _type: "release",
    title: RELEASE.title,
    slug: { _type: "slug", current: RELEASE.slug },
    label: RELEASE.label,
    tagline: RELEASE.tagline,
    artists: [
      { _type: "reference", _ref: "artist-nick-hook", _key: "a-1" },
      { _type: "reference", _ref: ANDY_BELL_ID, _key: "a-2" },
    ],
    tracklist: [
      { _key: "tr-0", title: RELEASE.title, feature: RELEASE.feature },
    ],
  });
  await c.patch(RELEASE._id).set({
    label: RELEASE.label,
    tagline: RELEASE.tagline,
    stemsTrackTitle: RELEASE.trackTitle,
    stems,
  }).commit();

  console.log(`\n✅ done — ${stems.length} stems wired to ${RELEASE.title}`);
  console.log(`   /jam (auto-loads as featured)`);
  console.log(`   /releases/${RELEASE.slug} (also has the stem player)\n`);
})();
