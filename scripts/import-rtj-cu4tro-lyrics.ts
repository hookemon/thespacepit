/* eslint-disable no-console */
/**
 * Batch lyrics import for the 4 Nick Hook tracks on RTJ CU4TRO (2023):
 *
 *   1. caminando en la nieve (Orestes Gomez & Nick Hook's Versión)
 *   2. goonies contra E.T. (Danny Brasco & Nick Hook's Versión)
 *   3. tirando el detonador (Mas Aya & Nick Hook's Versión)
 *   4. santa calamifuck (Eva, Chucho, Yulian & Nick Hook's Versión)
 *
 * Fetches each Genius page, extracts lyrics, matches to track on the
 * release tracklist by a substring of the title.
 *
 * Run: npx tsx scripts/import-rtj-cu4tro-lyrics.ts
 */
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

const RELEASE_ID = "release-ext-rtj-cu4tro-2023";

const TRACKS: { titleMatch: RegExp; geniusUrl: string }[] = [
  {
    titleMatch: /caminando en la nieve/i,
    geniusUrl: "https://genius.com/Run-the-jewels-caminando-en-la-nieve-orestes-gomez-and-nick-hooks-version-lyrics",
  },
  {
    titleMatch: /goonies contra/i,
    geniusUrl: "https://genius.com/Run-the-jewels-goonies-contra-et-danny-brasco-and-nick-hooks-version-lyrics",
  },
  {
    titleMatch: /tirando el detonador/i,
    geniusUrl: "https://genius.com/Run-the-jewels-tirando-el-detonador-mas-aya-and-nick-hooks-version-lyrics",
  },
  {
    titleMatch: /santa calam[ai]fuck/i,
    geniusUrl: "https://genius.com/Run-the-jewels-santa-calamifuck-eva-chucho-yulian-and-nick-hooks-version-lyrics",
  },
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
    .replace(/^[^\[]*?(?=\[)/, "") // strip Genius preamble
    .trim();
}

async function scrape(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.5",
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return await res.text();
}

async function main() {
  const release = await client.fetch<{
    tracklist?: { _key: string; title: string }[];
  }>(`*[_id == $id][0]{ tracklist[]{ _key, title } }`, { id: RELEASE_ID });
  if (!release.tracklist?.length) throw new Error("release has no tracklist");

  console.log(`Tracklist (${release.tracklist.length} tracks):`);
  release.tracklist.forEach((t, i) => console.log(`  [${i}] ${t.title}`));
  console.log();

  let ok = 0;
  let miss = 0;
  for (const tr of TRACKS) {
    const idx = release.tracklist.findIndex((t) => tr.titleMatch.test(t.title));
    if (idx === -1) {
      console.log(`✗ no track matched ${tr.titleMatch}`);
      miss++;
      continue;
    }
    const track = release.tracklist[idx];
    console.log(`→ scraping ${tr.geniusUrl}`);
    const html = await scrape(tr.geniusUrl);
    const lyrics = extractLyrics(html);
    if (lyrics.length < 80) {
      console.log(`  ✗ too short (${lyrics.length} chars), skip`);
      miss++;
      continue;
    }
    await client
      .patch(RELEASE_ID)
      .set({ [`tracklist[${idx}].lyrics`]: lyrics })
      .commit();
    console.log(`  ✓ tracklist[${idx}] "${track.title.slice(0, 60)}" → ${lyrics.length} chars`);
    ok++;
    // Be nice to Genius.
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log(`\n${ok}/${TRACKS.length} imported · ${miss} missed`);
  console.log(`Preview: https://thespacepit.com/releases/rtj-cu4tro-2023`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
