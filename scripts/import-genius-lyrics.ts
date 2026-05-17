/* eslint-disable no-console */
/**
 * One-shot: import Old English lyrics from Genius → wire onto track 1
 * of release-old-english-spinn-hook-remix.
 *
 * This is the bootstrap of the `lyrics-import` skill — once we know
 * this script works, generalize it for any (URL, release-slug,
 * track-title) input.
 *
 * Run: npx tsx scripts/import-genius-lyrics.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const HTML_PATH = "/tmp/genius-old-english.html";
const RELEASE_ID = "release-old-english-spinn-hook-remix";
const TRACK_TITLE_MATCH = "old english"; // case-insensitive substring

/** Extract lyrics from Genius HTML. */
function extractLyrics(html: string): string {
  // Genius wraps lyrics in <div data-lyrics-container="true">...</div>
  // (often multiple, one per verse/section). Newer Genius wraps in
  // <div class="Lyrics__Container-..."> too. Match both.
  const containerRe = /<div[^>]*data-lyrics-container=["']true["'][^>]*>([\s\S]*?)<\/div>/g;
  const fragments: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = containerRe.exec(html)) !== null) {
    fragments.push(m[1]);
  }
  if (fragments.length === 0) {
    // Fallback: try the Lyrics__Container class
    const fallbackRe = /<div\s+class=["']Lyrics__Container[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div|<\/section)/g;
    while ((m = fallbackRe.exec(html)) !== null) {
      fragments.push(m[1]);
    }
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
    .trim();
}

async function main() {
  const html = readFileSync(HTML_PATH, "utf8");
  const lyrics = extractLyrics(html);
  if (lyrics.length < 80) {
    console.error(`✗ Extracted lyrics too short (${lyrics.length} chars) — likely scrape failure`);
    console.error("First 500 chars of HTML:", html.slice(0, 500));
    process.exit(1);
  }
  if (!lyrics.includes("[")) {
    console.warn(`⚠ No verse markers found — lyrics may be incomplete`);
  }
  console.log(`✓ Extracted ${lyrics.length} chars, ${lyrics.split("\n").length} lines`);
  console.log(`First 400 chars:\n${lyrics.slice(0, 400)}\n...`);

  // Match to the track on the release
  const release = await client.fetch<{ tracklist?: { _key: string; title: string }[] }>(
    `*[_id == $id][0]{ tracklist[]{ _key, title } }`,
    { id: RELEASE_ID },
  );
  if (!release?.tracklist?.length) {
    throw new Error("release has no tracklist");
  }
  const idx = release.tracklist.findIndex((t) =>
    t.title.toLowerCase().includes(TRACK_TITLE_MATCH.toLowerCase()),
  );
  if (idx === -1) {
    throw new Error(`no track matching "${TRACK_TITLE_MATCH}" on ${RELEASE_ID}`);
  }
  const targetTrack = release.tracklist[idx];
  console.log(`\n→ patching ${RELEASE_ID}.tracklist[${idx}] = "${targetTrack.title}"`);

  await client
    .patch(RELEASE_ID)
    .set({ [`tracklist[${idx}].lyrics`]: lyrics })
    .commit();
  console.log(`✓ patched lyrics (${lyrics.length} chars) onto track "${targetTrack.title}"`);
  console.log(
    `→ preview: https://thespacepit.com/releases/old-english-spinn-hook-remix (click "lyrics" toggle)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
