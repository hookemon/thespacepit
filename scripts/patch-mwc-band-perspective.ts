/**
 * Reframe MWC content to band-perspective + fix Skully spelling.
 *
 * - Update the artist's name + slug (Scully → Skully). Old slug stays as
 *   a redirect via a new pageRedirect doc if that pattern exists; otherwise
 *   just rename the slug.
 * - Strip the "Nick's first band. 2004–2008." opener from the era story —
 *   the rest of the bio is band-perspective already.
 * - Replace "Scully" → "Skully" + "scully" → "skully" in the era's
 *   timeline, tagline, and story.
 * - Drop the "dissolved at the gramercy theatre" claim from the tagline,
 *   since the band is back working on new music.
 *
 * Idempotent. Run: npx tsx scripts/patch-mwc-band-perspective.ts
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

const SKULLY_ID = "artist-scully-sullivan-kaplan"; // _id stays — only slug + name change
const MWC_ID = "project-men-women-children";

function swapScully<T extends string | undefined>(s: T): T {
  if (!s) return s;
  return s.replace(/Scully/g, "Skully").replace(/scully/g, "skully") as T;
}

(async () => {
  // ── 1. Artist: rename + new slug ───────────────────────────────────────
  const artist = await client.fetch<{ _id: string; name?: string; slug?: { current?: string } } | null>(
    `*[_id == "${SKULLY_ID}"][0]{ _id, name, slug }`
  );
  if (artist) {
    await client
      .patch(SKULLY_ID)
      .set({
        name: 'David "Skully" Sullivan-Kaplan',
        slug: { _type: "slug", current: "skully-sullivan-kaplan" },
      })
      .commit();
    console.log(`✓ artist renamed: ${artist.name} → David "Skully" Sullivan-Kaplan`);
    console.log(`  slug: ${artist.slug?.current} → skully-sullivan-kaplan`);
  } else {
    console.warn(`⚠ artist ${SKULLY_ID} not found`);
  }

  // ── 2. MWC project: timeline + tagline + story sweep ──────────────────
  const project = await client.fetch<{
    timeline?: Array<{ _key?: string; year?: number; month?: string; milestone?: string }>;
    tagline?: string;
    story?: Array<any>;
  }>(`*[_id == "${MWC_ID}"][0]{ timeline, tagline, story }`);

  if (project) {
    // Timeline — swap Scully → Skully on every milestone
    const newTimeline = project.timeline?.map((m, i) => ({
      _key: m._key ?? `ml-${i}`,
      ...m,
      milestone: swapScully(m.milestone),
    }));

    // Tagline — Scully spelling + drop the "dissolved at gramercy" tail
    const newTagline = swapScully(project.tagline)
      ?.replace(/,?\s*dissolved at the gramercy theatre december 29,? ?2008\.?/i, ".")
      ?.replace(/\.+$/, ".");

    // Story — drop the opening "Nick's first band. 2004–2008." sentence
    // (it's the first span of the first block) + sweep Scully → Skully
    // through every text span.
    const newStory = project.story?.map((block, blockIdx) => {
      if (!block.children) return block;
      const children = block.children.map((span: any) => {
        if (typeof span.text !== "string") return span;
        let text = swapScully(span.text);
        if (blockIdx === 0) {
          // Drop the leading "Nick's first band. 2004–2008. " framing —
          // band-perspective opener wanted.
          text = text.replace(/^Nick's first band\.\s*\d{4}[–-]\d{4}\.\s*/i, "");
        }
        return { ...span, text };
      });
      return { ...block, children };
    });

    await client
      .patch(MWC_ID)
      .set({
        timeline: newTimeline ?? [],
        tagline: newTagline,
        story: newStory ?? [],
      })
      .commit();
    console.log(`✓ MWC project: timeline / tagline / story rewritten`);
  }

  // ── 3. Sweep Scully → Skully anywhere else (shows, press, etc.) ───────
  const refs = await client.fetch<Array<{ _id: string; _type: string }>>(
    `*[_type in ["show","pressQuote","release","studioSession","mix"] && (
      pt::text(body) match "*Scully*" ||
      headline match "*Scully*" ||
      title match "*Scully*" ||
      notes match "*Scully*"
    )]{ _id, _type }`
  );
  console.log(`\nSweep targets w/ "Scully": ${refs.length}`);
  console.log(refs.map((r) => `  ${r._type}: ${r._id}`).join("\n"));

  console.log("\ndone.\n");
})().catch((e) => { console.error(e); process.exit(1); });
