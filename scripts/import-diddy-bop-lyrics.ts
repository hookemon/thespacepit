/* eslint-disable no-console */
/**
 * One-off: Bodega Bamz "Diddy Bop" lyrics import. Co-produced by
 * Salva × Nick Hook — signature Nick Hook hip-hop placement.
 * Source: https://genius.com/Bodega-bamz-diddy-bop-lyrics
 *
 * Slug: release-diddy-bop
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

const HTML_PATH = "/tmp/genius-diddy-bop.html";

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

async function main() {
  const lyrics = extractLyrics(readFileSync(HTML_PATH, "utf8"));
  console.log(`Extracted ${lyrics.length} chars`);
  console.log(`First 300:\n${lyrics.slice(0, 300)}\n...`);

  // Find Bodega Bamz Diddy Bop release
  const candidates = await client.fetch<
    Array<{ _id: string; slug: string; title: string; tracklist?: { _key: string; title: string }[] }>
  >(
    `*[_type == "release" && lower(title) match "*diddy bop*"]{
      _id, "slug": slug.current, title, tracklist[]{ _key, title }
    }`,
  );
  console.log(`\nFound ${candidates.length} matching release(s):`);
  for (const c of candidates) {
    console.log(`  ${c._id} (${c.slug}): ${c.title} — ${c.tracklist?.length ?? 0} tracks`);
  }

  // Take the first match (Bodega Bamz - DIDDY BOP)
  const target = candidates[0];
  if (!target) throw new Error("No diddy bop release found");
  if (!target.tracklist?.length) throw new Error(`${target._id} has empty tracklist`);

  const idx = target.tracklist.findIndex((t) => /diddy bop/i.test(t.title));
  if (idx === -1) throw new Error("track not found");

  console.log(`\n→ patching ${target._id}.tracklist[${idx}] = "${target.tracklist[idx].title}"`);
  await client
    .patch(target._id)
    .set({ [`tracklist[${idx}].lyrics`]: lyrics })
    .commit();
  console.log(`✓ patched (${lyrics.length} chars)`);
  console.log(`→ preview: https://thespacepit.com/releases/${target.slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
