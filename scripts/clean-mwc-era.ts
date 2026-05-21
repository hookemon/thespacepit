/**
 * MWC era cleanup pass:
 *   - Trim timeline to the first 5 entries (drop June 2007, Nov 2008, Dec 2008)
 *   - Rewrite the March 2006 milestone — remove the "Recorded at Tarbox
 *     Road with Dave Fridmann; mixed by Gareth Jones." trailing sentence
 *   - Untag "mwc" from `video-Aik33qgcQ8w` (Nick Hook ft. Color Film —
 *     "It's a Sin") — that's a Nick Hook solo collab, not an MWC track.
 *
 * Idempotent. Run: npx tsx scripts/clean-mwc-era.ts
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

const MWC_ID = "project-men-women-children";
const COLOR_FILM_VIDEO_ID = "video-Aik33qgcQ8w";

(async () => {
  // ── 1. Timeline trim + Tarbox strip ────────────────────────────────────
  const project = await client.fetch<{ timeline?: Array<{ _key?: string; year?: number; month?: string; milestone?: string }> }>(
    `*[_id == "${MWC_ID}"][0]{ timeline }`
  );
  if (!project?.timeline) {
    console.warn("⚠ no timeline on MWC project — nothing to trim");
  } else {
    const KILL_PHRASES = [
      "Leave Warner Bros",
      "Tiombe Lockhart (vocals) and the band part",
      "Final show, Gramercy Theatre NYC",
    ];
    const trimmed = project.timeline
      .filter((m) => !KILL_PHRASES.some((kp) => m.milestone?.includes(kp)))
      .map((m) => {
        if (!m.milestone) return m;
        const stripped = m.milestone
          .replace(/\s*Recorded at Tarbox Road with Dave Fridmann;?\s*mixed by Gareth Jones\.?/i, "")
          .replace(/\s*Recorded at Tarbox Road with Dave Fridmann\.?/i, "")
          .trim();
        return { ...m, milestone: stripped };
      });
    await client
      .patch(MWC_ID)
      .set({ timeline: trimmed.map((m, i) => ({ _key: m._key ?? `ml-${i}`, ...m })) })
      .commit();
    console.log(`✓ timeline trimmed: ${project.timeline.length} → ${trimmed.length} entries`);
  }

  // ── 2. Untag color-film/MWC cross-tagged video ────────────────────────
  const video = await client.fetch<{ _id: string; title: string; tags?: string[] } | null>(
    `*[_id == "${COLOR_FILM_VIDEO_ID}"][0]{ _id, title, tags }`
  );
  if (!video) {
    console.warn(`⚠ ${COLOR_FILM_VIDEO_ID} not found`);
  } else if (!video.tags?.includes("mwc")) {
    console.log(`✓ ${video._id} already not tagged mwc — skipping`);
  } else {
    const newTags = video.tags.filter((t) => t !== "mwc");
    await client.patch(COLOR_FILM_VIDEO_ID).set({ tags: newTags }).commit();
    console.log(`✓ untagged mwc from "${video.title}" — tags now ${JSON.stringify(newTags)}`);
  }

  console.log("\ndone.\n");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
