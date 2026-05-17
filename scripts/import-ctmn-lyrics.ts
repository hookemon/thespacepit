/* eslint-disable no-console */
/**
 * One-off: "Can't Tell Me Nothing" (Nick Hook Ft. Novelist) lyrics import.
 * Release: release-cc016-cant-tell-me-nothing-remixes
 *
 * Source: https://genius.com/Nick-hook-cant-tell-me-nothing-lyrics
 */
import { readFileSync } from "node:fs";
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

const HTML_PATH = "/tmp/genius-ctmn.html";
const RELEASE_ID = "release-cc016-cant-tell-me-nothing-remixes";

function extractLyrics(html: string): string {
  const containerRe = /<div[^>]*data-lyrics-container=["']true["'][^>]*>([\s\S]*?)<\/div>/g;
  const fragments: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = containerRe.exec(html)) !== null) {
    fragments.push(m[1]);
  }
  const raw = fragments
    .map((f) => f.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""))
    .join("\n\n");
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[^\[]*?(?=\[)/, "") // strip Genius "N Contributors / Song Lyrics" preamble before first verse marker
    .trim();
}

async function main() {
  const lyrics = extractLyrics(readFileSync(HTML_PATH, "utf8"));
  console.log(`Extracted ${lyrics.length} chars`);
  console.log(`First 300: ${lyrics.slice(0, 300)}\n...`);

  const release = await client.fetch<{ tracklist?: { _key: string; title: string }[] }>(
    `*[_id == $id][0]{ tracklist[]{ _key, title } }`,
    { id: RELEASE_ID },
  );
  let tracklist = release.tracklist;
  if (!tracklist || tracklist.length === 0) {
    console.log("No tracklist — adding 1-track tracklist with original.");
    await client
      .patch(RELEASE_ID)
      .set({
        tracklist: [
          {
            _key: randomUUID(),
            _type: "track",
            title: "Can't Tell Me Nothing",
            features: ["Novelist"],
          },
        ],
      })
      .commit();
    tracklist = [
      {
        _key: "",
        title: "Can't Tell Me Nothing",
      },
    ];
  }
  const idx = tracklist.findIndex((t) => /can'?t tell me nothing/i.test(t.title));
  if (idx === -1) throw new Error("track not found");
  await client
    .patch(RELEASE_ID)
    .set({ [`tracklist[${idx}].lyrics`]: lyrics })
    .commit();
  console.log(`✓ patched lyrics onto ${RELEASE_ID}.tracklist[${idx}]`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
