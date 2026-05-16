/**
 * Wire the Glove release with everything we have:
 *   1. Boo signature photo → pageBackgroundImage (fades into purple
 *      behind the page content)
 *   2. Original "If The Glove Don't Fit" MP3 → promoAudio
 *   3. QOQEQA hyper-merengue remix M4A → promoAudioAlt
 *   4. Recording-session YouTube video (eA0fnHTi-No) → prepended to videos[]
 *
 * Run: npx tsx scripts/wire-glove-everything.ts
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
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

const RELEASE_ID = "release-nick-hook-boo-pawmps-glove";
const SIGNATURE_PATH = "/tmp/boo-signature.jpg";
const ORIGINAL_MP3 =
  "/Users/nickhook/Library/CloudStorage/Dropbox/Jakub/Nick Hook Ft. Gangsta Boo + Pawmps/1-Nick Hook Ft. Gangsta Boo + Pawmps- If The Glove Don't Fit.mp3";
const QOQEQA_M4A = "/tmp/glove-qoqeqa.m4a";
const RECORDING_VIDEO = "https://youtu.be/eA0fnHTi-No";

async function main() {
  // ── 1. Signature → pageBackgroundImage ───────────────────────────────────
  console.log("→ uploading signature photo as page background…");
  const sigBuf = readFileSync(SIGNATURE_PATH);
  const sigAsset = await client.assets.upload("image", sigBuf, {
    filename: "boo-signature-wall.jpg",
    contentType: "image/jpeg",
  });
  console.log(`  asset ${sigAsset._id} (${(sigBuf.length / 1024).toFixed(0)} KB)`);

  // ── 2. Original MP3 → promoAudio ─────────────────────────────────────────
  console.log("→ uploading original MP3…");
  const mp3Buf = readFileSync(ORIGINAL_MP3);
  const mp3Asset = await client.assets.upload("file", mp3Buf, {
    filename: "if-the-glove-dont-fit-original.mp3",
    contentType: "audio/mpeg",
  });
  console.log(`  asset ${mp3Asset._id} (${(mp3Buf.length / (1024 * 1024)).toFixed(1)} MB)`);

  // ── 3. QOQEQA remix M4A → promoAudioAlt ──────────────────────────────────
  console.log("→ uploading QOQEQA remix M4A…");
  const remixBuf = readFileSync(QOQEQA_M4A);
  const remixAsset = await client.assets.upload("file", remixBuf, {
    filename: "if-the-glove-dont-fit-qoqeqa-remix.m4a",
    contentType: "audio/mp4",
  });
  console.log(`  asset ${remixAsset._id} (${(remixBuf.length / (1024 * 1024)).toFixed(1)} MB)`);

  // ── 4. Patch the release with everything ─────────────────────────────────
  console.log("→ patching release…");

  // First pull the current videos to prepend the recording video (and
  // skip if it's already in there).
  const current = await client.fetch<{ videos?: Array<{ youtubeUrl: string }> }>(
    `*[_id == $id][0]{ videos }`,
    { id: RELEASE_ID },
  );
  const currentVids = current.videos ?? [];
  const alreadyHasRecording = currentVids.some((v) => v.youtubeUrl === RECORDING_VIDEO);
  const newVideos = alreadyHasRecording
    ? currentVids
    : [
        {
          _key: randomUUID(),
          _type: "object",
          title: "Recording session — making 'If The Glove Don't Fit'",
          youtubeUrl: RECORDING_VIDEO,
        },
        ...currentVids,
      ];

  await client
    .patch(RELEASE_ID)
    .set({
      pageBackgroundImage: {
        _type: "image",
        asset: { _type: "reference", _ref: sigAsset._id },
      },
      promoAudio: {
        _type: "file",
        asset: { _type: "reference", _ref: mp3Asset._id },
      },
      promoAudioAlt: {
        _type: "file",
        asset: { _type: "reference", _ref: remixAsset._id },
      },
      promoAudioAltLabel: "QOQEQA hyper-merengue remix",
      videos: newVideos,
    })
    .commit();
  console.log(`✓ ${RELEASE_ID}: bg + 2 audio tracks + recording video wired`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
