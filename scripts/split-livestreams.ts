/**
 * Split the existing `live-set` tagged videos into:
 *   - `livestream` for long-form (>= 30 min) — the casual hours-long streams
 *   - `live-set` for short performances — DJ sets, festival appearances
 *
 * Also catches videos missed by the original auto-tagger (titles like
 * "STREAM" / "LIVE" without other keywords) and tags them appropriately.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

// Convert "1:23:45" / "47:53" / "0:51" → seconds
function parseDuration(d?: string): number {
  if (!d) return 0;
  const parts = d.split(":").map((n) => parseInt(n, 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

const LIVESTREAM_TITLE = /\b(stream|streaming|streamin'|2025 type|live (?:w|with|@|in|from)|lets get it|night session|workin on tracks)\b/i;
const SET_OR_LIVE = /\b(set|live|stream|festival|jam)\b/i;

(async () => {
  const all: { _id: string; title: string; duration?: string; tags?: string[] }[] = await c.fetch(
    `*[_type == "video" && hidden != true]{ _id, title, duration, tags }`
  );

  let upgraded = 0;     // live-set → livestream (long form)
  let untouched = 0;    // already correct
  let newlyTagged = 0;  // had no live tag, now does

  for (const v of all) {
    const tags = new Set(v.tags ?? []);
    const sec = parseDuration(v.duration);
    const titleHit = LIVESTREAM_TITLE.test(v.title);
    const looksLive = SET_OR_LIVE.test(v.title);
    let changed = false;

    if (tags.has("live-set") && sec >= 30 * 60) {
      // Long → livestream (replace, don't dual-tag)
      tags.delete("live-set");
      tags.add("livestream");
      changed = true;
      upgraded++;
    } else if (!tags.has("live-set") && !tags.has("livestream") && (titleHit || looksLive)) {
      // Was missed entirely — pick lane by duration
      tags.add(sec >= 30 * 60 ? "livestream" : "live-set");
      changed = true;
      newlyTagged++;
    } else {
      untouched++;
    }

    if (changed) {
      await c.patch(v._id).set({ tags: [...tags] }).commit();
    }
  }

  console.log(`\n📺 stream split done`);
  console.log(`   ${upgraded} videos: live-set → livestream (≥30 min)`);
  console.log(`   ${newlyTagged} videos: previously untagged, now tagged`);
  console.log(`   ${untouched} videos: unchanged`);

  // Final counts
  const counts = await c.fetch<Record<string, number>>(
    `{
      "livestream": count(*[_type == "video" && "livestream" in tags]),
      "live-set":   count(*[_type == "video" && "live-set" in tags])
    }`
  );
  console.log(`\nfinal: ${counts["live-set"]} live-set · ${counts["livestream"]} livestream\n`);
})();
