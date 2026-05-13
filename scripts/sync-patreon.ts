/**
 * sync-patreon — pull every Patreon post → upsert into Sanity as `vaultDrop`
 * documents. Idempotent, keyed on `patreonPostId` so re-running won't dupe.
 *
 * USAGE:
 *   npx tsx scripts/sync-patreon.ts            # default: sync every post
 *   npx tsx scripts/sync-patreon.ts --dry-run  # show what WOULD happen
 *   npx tsx scripts/sync-patreon.ts --setup    # walk through first-time setup
 *
 * FIRST-TIME SETUP (5 min):
 *   1. Go to patreon.com/portal/registration/register-clients
 *   2. Click "Create Client", fill in:
 *        App Name:        thespacepit
 *        Description:     auto-sync vault drops to thespacepit.com
 *        App Category:    Productivity
 *        Redirect URI:    http://localhost:3000/api/patreon/callback
 *        Privacy URL:     https://thespacepit.com/privacy (or anything)
 *        TOS URL:         https://thespacepit.com/terms   (or anything)
 *   3. Patreon shows you 4 keys. Paste them into .env.local:
 *        PATREON_CLIENT_ID=...
 *        PATREON_CLIENT_SECRET=...
 *        PATREON_ACCESS_TOKEN=...     (labeled "Creator's Access Token")
 *        PATREON_REFRESH_TOKEN=...    (labeled "Creator's Refresh Token")
 *   4. Run: npx tsx scripts/sync-patreon.ts --setup
 *        — this auto-discovers your campaign ID and prints it.
 *   5. Paste that into .env.local as PATREON_CAMPAIGN_ID=...
 *   6. Run: npx tsx scripts/sync-patreon.ts  → all posts sync into Sanity.
 *
 * AFTER SETUP — just run `npx tsx scripts/sync-patreon.ts` whenever you
 * want the site to catch up with new Patreon posts. We'll wire this to a
 * cron / webhook later so it's automatic.
 */
import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import {
  listCampaignPosts,
  listCampaigns,
  type PatreonAuthBundle,
  type PatreonPost,
} from "../app/_lib/patreon";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ Missing env var: ${key}`);
    console.error("  See the FIRST-TIME SETUP block at the top of this file.");
    process.exit(1);
  }
  return v;
}

/**
 * Build a stable doc ID from the Patreon post ID. Prefix avoids collisions
 * with any other doc IDs in Sanity.
 */
function dropId(patreonPostId: string): string {
  return `vaultDrop-patreon-${patreonPostId}`;
}

/**
 * Slugify a title for the Sanity slug field. Keep it human-readable.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

/**
 * Strip HTML to plain text for the excerpt fallback. Patreon's content is
 * HTML; we want ~200 chars for the public teaser.
 */
function htmlToExcerpt(html: string | null): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 280 ? text.slice(0, 280).trimEnd() + "…" : text;
}

/**
 * Heuristic: classify a Patreon post by title/content into a vaultDrop kind.
 */
function inferKind(post: PatreonPost): string {
  const title = (post.attributes.title ?? "").toLowerCase();
  const content = (post.attributes.content ?? "").toLowerCase();
  const t = `${title} ${content}`;
  if (/\b(sample pack|sample-pack|drum kit|drum-kit|sounds|samples?)\b/.test(t)) return "sample-pack";
  if (/\b(stems?|loop pack|loops|multitrack|midi)\b/.test(t)) return "audio";
  if (/\b(pdf|deck|paperwork|brief|agreement|liner)\b/.test(t)) return "pdf";
  if (/\b(video|footage|clip|reel|behind the scenes|bts)\b/.test(t)) return "video";
  if (/\b(session|jam|studio)\b/.test(t)) return "session";
  if (/\b(office hours|1-?on-?1|q&a)\b/.test(t)) return "office-hours";
  return "post";
}

async function setup(auth: PatreonAuthBundle, clientId: string, clientSecret: string) {
  console.log("→ Looking up your Patreon campaign(s)...");
  const campaigns = await listCampaigns(auth, clientId, clientSecret);
  if (campaigns.length === 0) {
    console.error("✗ No campaigns found for this token. Make sure you registered the API client under your CREATOR account, not a backer account.");
    process.exit(1);
  }
  console.log(`✓ Found ${campaigns.length} campaign(s):\n`);
  for (const c of campaigns) {
    console.log(`   campaign id: ${c.id}`);
    console.log(`   name:        ${c.attributes.creation_name ?? "(unset)"}`);
    console.log(`   patrons:     ${c.attributes.patron_count}`);
    console.log(`   pledge_url:  ${c.attributes.pledge_url}`);
    console.log("");
  }
  console.log("Paste the campaign id into .env.local:");
  console.log(`   PATREON_CAMPAIGN_ID=${campaigns[0].id}`);
  console.log("\nThen run: npx tsx scripts/sync-patreon.ts");
}

async function syncOnce({
  dryRun,
  auth,
  clientId,
  clientSecret,
  campaignId,
}: {
  dryRun: boolean;
  auth: PatreonAuthBundle;
  clientId: string;
  clientSecret: string;
  campaignId: string;
}) {
  console.log("→ Fetching every post from your campaign…");
  const { posts } = await listCampaignPosts(campaignId, auth, clientId, clientSecret);
  console.log(`✓ Got ${posts.length} posts.\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const title = post.attributes.title ?? "(untitled patreon post)";
    if (!post.attributes.title) {
      // Skip silently — happens for note-style empty posts.
      skipped++;
      continue;
    }

    const _id = dropId(post.id);
    const slug = slugify(post.attributes.title);
    const coverUrl =
      post.attributes.image?.large_url ??
      post.attributes.image?.url ??
      post.attributes.image?.thumb_url ??
      undefined;

    // Fields we ALWAYS overwrite (canonical source = Patreon)
    const upstream = {
      title: post.attributes.title,
      patreonPostId: post.id,
      patreonUrl: post.attributes.url,
      publishedAt: post.attributes.published_at,
      isPaid: post.attributes.is_paid ?? true,
      minCentsPledged: post.attributes.min_cents_pledged_to_view ?? null,
      contentHtml: post.attributes.content ?? null,
      coverUrl,
    };

    // Check if exists
    const existing = await sanity.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{ _id }`,
      { id: _id },
    );

    if (existing) {
      console.log(`  ↻ update  ${title.slice(0, 70)}`);
      if (!dryRun) {
        await sanity.patch(_id).set(upstream).commit();
      }
      updated++;
    } else {
      console.log(`  + create  ${title.slice(0, 70)}`);
      if (!dryRun) {
        await sanity.createIfNotExists({
          _id,
          _type: "vaultDrop",
          slug: { _type: "slug", current: slug },
          excerpt: htmlToExcerpt(post.attributes.content),
          kind: inferKind(post),
          featured: false,
          hidden: false,
          ...upstream,
        });
      }
      created++;
    }
  }

  console.log("\n--- summary ---");
  console.log(`  created:  ${created}`);
  console.log(`  updated:  ${updated}`);
  console.log(`  skipped:  ${skipped} (no title)`);
  console.log(`  total:    ${posts.length}`);
  if (dryRun) console.log("\n  (DRY RUN — no Sanity writes)");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const setupMode = process.argv.includes("--setup");

  const clientId = requireEnv("PATREON_CLIENT_ID");
  const clientSecret = requireEnv("PATREON_CLIENT_SECRET");
  const accessToken = requireEnv("PATREON_ACCESS_TOKEN");
  const refreshToken = requireEnv("PATREON_REFRESH_TOKEN");
  const auth: PatreonAuthBundle = { accessToken, refreshToken };

  if (setupMode) {
    await setup(auth, clientId, clientSecret);
    return;
  }

  const campaignId = requireEnv("PATREON_CAMPAIGN_ID");
  await syncOnce({ dryRun, auth, clientId, clientSecret, campaignId });
}

main().catch((e) => { console.error(e); process.exit(1); });
