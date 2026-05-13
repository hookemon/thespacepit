# thespacepit — Move-Centric Product Plan

_Aligned 2026-05-12 with the actual state of the site. `/packs` already has a sophisticated free/vault/purchase rail architecture in Sanity — this plan fits the Move kits into that, doesn't replace it._

## What's already built (don't rebuild)

- **`/packs` page** with three rails: FREE (green) · VAULT (lamp, patreon unlock) · PURCHASE (red, gumroad/bandcamp)
- **Pack Sanity schema** (`sanity/schemas/pack.ts`) with: name/slug/kind/gear refs/release refs/access tier/downloadUrl/vaultUrl/previewUrl/youtubeUrl/cover/price/featured. Already supports everything we need for the Move-kit product.
- **Live packs:** 909 Day Pack v1 (free), 1-on-1 with Nick, Dancehall 103am — Move Set, Stylophone Beat Pack, SP-1200 Sample Pack, WYGD — Sample Pack.
- **Newsletter signup** — `NewsletterForm` component + `/api/newsletter` route now live on `/packs`. Awaiting `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` env vars to switch from "503 not configured" to live signup.
- **`/sessions`** is built and shipping with Formspree booking.
- **Vault tier** wired to Patreon via `vaultUrl`.

## The Move-centric strategy in this architecture

Three pack entries cover the strategy without any new code:

### 1. FREE rail · "Nick Hook Move Sessions — Starter 5"
- Sanity Pack with `access: free`, `kind: template`, `gear: [Ableton Move]`
- 5 ready-to-go Move sessions that Nick already has done (he confirmed: "we can give free sessions i already have them done")
- `downloadUrl`: hosted file (Gumroad $0 product, Dropbox link, or direct CDN)
- Purpose: lead magnet. Lives in the FREE rail. Drives email capture via the newsletter form on the same page.

### 2. PURCHASE rail · "Nick Hook Song Starters — 32 Move Sessions"
- Sanity Pack with `access: purchase`, `kind: template`, `gear: [Ableton Move]`
- The premium 32-kit product (Move project files + Ableton Live ports + Drift patches + per-kit videos + stems bonus)
- `downloadUrl`: Gumroad listing URL (or eventually Shopify spacepit store)
- `youtubeUrl`: master overview video showing all 32 kits
- `previewUrl`: Bandcamp/SoundCloud preview audio
- Price: $39-79 range
- Purpose: premium revenue product. Free-tier-buyers convert to this; the 32 demo videos do double duty as social content for months.

### 3. VAULT rail · stems & deep cuts (later)
- Stems bundles, alternate versions, project files for full songs — the "deeper, weirder, the stuff that wouldn't survive a public release" rail
- Lives on Patreon, unlocked via `vaultUrl`
- Lower priority; ships after the FREE + PURCHASE pair is converting

## Curation criteria (dual-market design)

For each of the 32 kits to satisfy both markets — Tetris-arrangers AND choppers:

- Each kit performable as-is on Move (full self-contained session)
- Loops inside have chop-worthy moments (vocal stab, dynamic shift, weird transition)
- Clean transients for downbeat chopping
- BPM/key in filename
- Mid-tempo coverage (90-140 BPM)
- Variety of keys (Am, Cm, Fm, Dm prioritized)
- Cohesive sonic identity across the pack — feels like _one record's_ worth of starting points, not 32 random vibes

## Naming convention

Adapt the Splice convention (from existing Vol 1) with room-aware prefix:

```
THESPACEPIT_MOVE_kit_{descriptor}_{bpm}_{key}.{ext}
THESPACEPIT_LIVE_kit_{descriptor}_{bpm}_{key}.{ext}
THESPACEPIT_DRIFT_{descriptor}.{ext}
```

## Source material

The MOVE_LIBRARY on T7 (1,826 audio files, organized into 01_DRUMS / 02_ONE SHOTS / 03_LOOPS / etc.) is the raw material pool. The 32 kits are built either from existing Move sessions Nick already has on the device OR assembled fresh from the library.

**The big unknown:** how many ready-or-nearly-ready Move kits does Nick already have on the device or in session backups? If 20+, this is curation work. If 5, it's production work.

## Sales channel

Per `project_spacepit_store.md` memory, Shopify is the long-term home for digital products on the unified spacepit store.

- **Free pack:** can launch immediately via direct download (`downloadUrl` field in Sanity).
- **Paid 32-kit pack:** ship on Gumroad first (fast), migrate to Shopify when the spacepit store ships. Or wait for Shopify if Nick wants single-source from day 1.

## What gets deferred

- Process Room loops pack (still on roadmap, after Move kits)
- Tom Builder Power Station Toms pack (overlaps with Tom Builder M4L launch)
- The original 743-loop audition (the kits product is more focused)

## Open questions for Nick

- **How many existing Move kits do you have ready?** Determines curation vs production work.
- **Free pack content:** can you point me at the 5 sessions you'd give away? Paths on T7 work.
- **Channel:** Gumroad-now vs wait-for-Shopify?
- **Video format:** ~30s vertical for social, longer YouTube breakdowns, or both?
- **Mailchimp keys:** when you generate the API key + audience ID, drop them in `.env.local` as `MAILCHIMP_API_KEY` and `MAILCHIMP_LIST_ID`. The form goes live immediately — no code changes.

## Concrete next actions (Claude-side, when Nick directs)

1. Add the FREE 5-session pack as a Sanity entry once Nick provides session files and `downloadUrl`
2. Add the PURCHASE 32-kit pack as a Sanity entry once that product exists
3. Build per-kit video previews on the Pack detail page (`/packs/[slug]`) using existing `youtubeUrl` and `previewUrl` fields
4. Add the NewsletterForm to `/sessions` page and Footer (currently only on `/packs`) — wider capture surface
5. Once Mailchimp env vars arrive, smoke-test signup end to end
