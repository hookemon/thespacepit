# site · master to-do

Last updated: 2026-05-18 overnight catalog session.

## crushed overnight (2026-05-17 → 2026-05-18)

- [x] **Full-track audio uploaded across the owned catalog** — 175+ tracks across 38 C+C / Calllm / Hookemon / Lockhart releases now have per-track audio hosted on Sanity CDN (was Bandcamp tokens that expired → 410). MiniPlayer, full-album queue, durable URLs.
- [x] **Per-track `audio` schema field + render integration** — replaces the legacy `audioPreviewUrl` Bandcamp pattern.
- [x] **DSP platform URLs filled to all 9 platforms** — fetch-platform-urls.ts extended past spotify/apple/youtube to also fill tidal, amazonMusic, deezer, youtubeMusic, soundcloud. 27+ releases got new DSP links in round 1; round 2 running.
- [x] **Release page locked in Nick's canonical order** — Hero → Bio → Tracks → (single-Video room) → Credits → (multi-Watch room) → Press → Physical → Gallery.
- [x] **Credit ordering + filter spec** — Produced → Additional Prod → Written → Performed → instruments (Vocals, Guitar, Bass, etc.) → Mixed → Mastered → Engineering → Recorded at. Programming/keys/"Recorded by" filtered out per Nick.
- [x] **Per-track credit popouts** — features show inline ("▾ credits" on track row) instead of polluting the vinyl jacket.
- [x] **Tracklists reordered to release order** — 11 alphabetized tracklists patched via `reorder-tracklists-from-files.ts`.
- [x] **Missing tracks added to incomplete releases** — Josephine (1→5 tracks), Black & Blue (1→5), Darko (5→6), Breath You Out (0→6).
- [x] **Hero chip strip lit up with linkable artist refs** — 31 free-text credits upgraded to person refs across 9 releases. Recurring collaborators (Trooko, Thee Mike B, Seven Davis Jr, Nadus, Hooke, etc.) all clickable.
- [x] **Per-release Rothko gradient backgrounds** — 40 releases got a 2-color diagonal sweep sampled from their own cover art (cream center for legibility). 8 typographic / B&W releases stayed clean negative-space. Render layer updated to 0.75 opacity (was 0.55 + 0.4 tint sandwich that washed designed work to noise).
- [x] **Catalog sort is now chronological** (releaseDate desc) — newest at the top instead of label-priority.
- [x] **Bios + credits patched per Nick's spec** — Josephine, Hoes Come Out, Follow Your Heart (full per-track depth), Take Me High, Darko, Without You, Peephole, Drums, Like Water, Spiritual Friendship S/T, all 7 Calllm chakras (Root → Crown with the shared DRONES PR doc bio).
- [x] **Drums gallery** — 51 photos (session shots + drum machine macros + spacePitDrums series) uploaded as `release.gallery[]`.
- [x] **19 artist bios + taglines + city written** — Joe LaPorta, Jamire Williams, Lenny Castro, Gaslamp Killer, Computer Jay, Adam Garcia, Dust La Rock, Mike 2600, Daryl Palumbo, Rick Penzone, Brian Iele, John Kuker, Bilal, Drop The Lime, Andrea Balency, Dâm-Funk, Seven Davis Jr, Nadus, Thee Mike B.
- [x] **Cubic Zirconia + Spiritual Friendship + member bios** — duo / band canonical bios written. Tiombe Lockhart, Todd Weinstock, Daud Sturdivant expanded.
- [x] **Lola Mitchell merged → Gangsta Boo. The Pressure merged → Adam Garcia.** Dup stub docs deleted; credits remapped to canonical refs.
- [x] **Fake "Nick Hook" YouTube remix removed from Without You + bogus "Superhero Killer" video removed from CC022** — the Odesli backfill caught wrong-channel matches; verified + cleared.
- [x] **Salva remix removed from CC021 Tardes de Verano** — flagged for the future unreleased-vault section, asset still in Sanity storage.
- [x] **Adam Garcia credited for Drums artwork. Dust La Rock credited for Follow Your Heart.**

---

This is the running list of everything outstanding across the three sites.
Sorted by **what unblocks the most** first.

---

## 🟢 things i (claude) can do solo, no input needed

These I'll knock out as I have time. No need to wait on you.

- [x] **Era stories** — populated 10 era pages with rich text (MWC, Cubic Zirconia, Hookemon, C+C, Calllm, LDCC, RTJ Tour 2017, Asia/India, Solo DJ, Drop The Lime live).
- [x] **Studio pages** (`/studios/thespacepit` + `/studios/la-burbuja`) — built + seeded with story/gear/copy. Hallway photo wired.
- [x] **Cubic Zirconia covers + embeds** for LDCC001 (Josephine) + LDCC002 (Black & Blue). The other 4 (LDCC003–006) aren't on cubiczirconia.bandcamp.com — see below.
- [x] **Studio clients curated** — 68 names alphabetical, no JPEGMAFIA, no Paul McCartney, no LA-only / Colombia-only collaborators.
- [x] **Production credits table** — 24 outside-the-label credits scraped from Discogs (RTJ4, Old English, Junglepussy JP4, Action Bronson, Hudson Mohawke, Flatbush Zombies, Cassius, etc.).
- [x] **Real spacepit hero stats** — pulled live from YouTube + Discord.
- [x] **NICK HOOK custom logo** — extracted from the PDF, fixed the bottom-clip.
- [x] **Hallway photo** — extracted from the EPK, wired as the spacepit hero.
- [ ] **Wall-tag close-up gallery** — crop sections of the hallway photo around the GUCCI / SHABADU / NAKED signatures and surface them as a strip on /spacepit. (small effort, does it match the gear shelf re-skin work? deciding.)
- [ ] **Re-skin the gear shelf** — turn the dry table on /spacepit into a magazine-style row-per-piece with a photo + provenance story. (medium effort.)

### Dossier / publishing pipeline (opened 2026-05-17)

- [ ] **Re-patch CC015 writer + publisher splits from Master Discog 2.0** — currently `publisherShare` mirrors `writerShare` everywhere (because I only had one number when migrating). The Master Discog 2.0 sheet has them as separate columns and they diverge on some tracks (e.g. "+3" — 25% writer / 30% publisher for Nick). Pull both columns track-by-track for accurate splits sheets.
- [ ] **Splits-sheet CSV export** — `/releases/[slug]/splits.csv?key=<DOSSIER_ACCESS_KEY>` route that emits the format publishers actually want: one row per writer × track with writerShare / publisherShare / PRO / IPI / publisher / publisher PRO / publisher IPI. Same gating as the dossier page.
- [ ] **CCINST001 Relationships (Instrumentals) enrichment** — same pass we did on CC015: writerCredits + ℗ © + UPC. Inherits compositions (and therefore writer splits) from CC015; new master so own P-copyright (℗ 2025 Calm + Collect Instrumental, set).
- [ ] **Stub the 2004 "Burn Out Baby" EP (In Music)** — catalog gap surfaced via RA artist page. Two RA reviews exist (original + remixes) that can attach to the doc once it lands. Era: pre-Cubic-Zirconia / MWC-adjacent.
- [ ] **Brand `articleBody` data migration** — schema rename `block` → `articleBlock` (done this session to clear the Studio-blocking error). If any brand docs have populated `articleBody` (Ableton, TE), the old `_type: "block"` items need migrating to `_type: "articleBlock"` or re-seeding via `scripts/seed-ableton-brand.ts` / `seed-te-brand.ts`.

---

## 🟡 needs your input — small (each is < 5 min from you)

Drop the answers/files in chat and I bulk-add via script.

### URLs

- [ ] **Cubic Zirconia LDCC003–006** — *Hoes Come Out at Night, Follow Your Heart, Take Me High, Darko*. Not on cubiczirconia.bandcamp.com. Where do they live? (Spotify? Fool's Gold Records Bandcamp? Old YouTube uploads? "Officially unreleased"?)
- [ ] **CLM008 + CLM009** (Third Eye + Crown chakras) — only the first 5 chakras are on the Drones album. Where are these two? (Unreleased? On a different page? On YouTube?)
- [ ] **Bandcamp embed IDs** for the rest of the Calllm / Lockhart / Hookemon catalog — the 13 that don't have iframe embeds yet only have linkout buttons. Each one needs its numeric `track=` or `album=` ID from Bandcamp's Share/Embed.
- [ ] **General label inbox email** — currently everything routes through `coleman@smooth-loop.com`. If C+C / press has a separate inbox, I'll wire it.
- [ ] **Beatport URL** for Calm + Collect — currently null in `social-links.ts`.

### Photos

- [ ] **CC018 Tardes De Verano** — no cover JPG in Dropbox folder. Want me to use a placeholder? Or upload one?
- [ ] **CC028 Drums 2** — only PDFs in the ART folder. I'm trying to convert the j-card front to JPG (running). If that doesn't look right, drop me a JPG.
- [ ] **CC029 Union EP** — folder doesn't exist yet in Dropbox. Add a folder + cover for me to pick up via sync.
- [ ] **Hero photo for /nick-hook** — currently typography only. A portrait, in-studio shot, or with collaborators would change the whole feel.
- [ ] **Hero photo for /calm-collect** — currently typography + featured-release card. Could add a label-feel photo (release pile, the wall, etc.) but optional.

### Lists / data

- [ ] **The 4 missing studio clients I'd need** — paste a list of artists who've recorded at thespacepit that I'm missing. Cross-ref against the on-screen list. I have 68 names; full list is probably 100+.
- [ ] **MORE press articles** — let Claude Chat (web app) do a wider web scrape with full search. Drop URLs to me; I'll seed them as PressQuote docs.
- [ ] **More mix URLs** — one of you mixed shows on Mixcloud you want surfaced beyond the 12 we have.
- [ ] **Brand logos** — for the 13 brands at /partners. PNGs / SVGs, ideally transparent. No logos = name-on-color placeholder for now.

### Sanity Studio

- [ ] **Register `/studio` for editing** — go to `localhost:3000/studio` (or the deployed URL once we ship), click "Add development host," log in. Then everything (releases, brands, eras, mixes, studios, press) becomes editable via dashboard with no code edits.

---

## 🔴 needs your input — bigger asks

### Booking → Formspree

- [ ] **Sign up at formspree.io** with your booking email → free tier covers ~50 submissions/month.
- [ ] Generate an endpoint, paste it into `.env.local` as `NEXT_PUBLIC_FORMSPREE_ENDPOINT`. Booking forms switch from "open your email client" to real form submissions hitting Coleman's inbox.

### Newsletter (Mailchimp)

- [x] **Newsletter signup form built** — `NewsletterForm` component + `/api/newsletter` route, live on `/packs`. Returns a friendly 503 until keys arrive. _(Done 2026-05-12.)_
- [ ] **Mailchimp API key + audience ID** → set `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` in `.env.local` and on Netlify. Form switches from "wiring up" to live signup with zero code changes.
- [ ] **Add NewsletterForm to `/sessions`** — currently only on `/packs`. Sessions traffic from the socials push should also have a capture point.
- [ ] **Add NewsletterForm slot to Footer** — across-site capture surface.

### Discord live data

- [ ] **Discord Server Settings → Widget → toggle on Server Widget** + send me the Server ID. The "in the discord" stat on /spacepit goes from "—" to live "N online now."

### Instagram cross-ref

- [ ] **Download your IG followers JSON** (Instagram → Settings → Account Center → Your information → Download your information → followers). I cross-reference vs. the studio clients list and surface candidates I missed.

### Press scrape

- [ ] **Use Claude Chat for the wider web scrape** — Pitchfork / Sound on Sound / Fader / Fact / SPIN / XLR8R / Billboard. Paste me back URLs of articles I should seed.
  - ✅ **Scraped 2026-05-17:** FADER (21), FACT Magazine (16), Complex (7), Pitchfork (3) — 47 articles, 326 pressQuote docs total in Sanity. Plus entity-cleanup pass fixed 40 docs across the whole archive.
  - 🚫 **Blocked by Cloudflare / anti-scrape** (need workaround — RSS, direct URL paste, or auth): BrooklynVegan, Resident Advisor news/features, Pigeons & Planes, Paper Magazine. Their search returns 403/404 to non-browser requests even with a full Safari UA. If you can paste me URLs from those, I'll scrape individually.

### Dossier deploy

- [ ] **Set `DOSSIER_ACCESS_KEY` in production env** (Netlify dashboard → site → env vars) — separate value from local. Without it set, `/releases/[slug]/dossier?key=...` returns 404 in prod (which is fail-closed, safe — but means no one including you can open dossiers on the deployed site). Generate fresh: `openssl rand -hex 16`. Local key is in `.env.local`.

---

## 📦 deploy — when you're ready

- [x] **Netlify project + env vars set up** at `thespacepit.netlify.app`.
- [x] **`netlify.toml` build config in repo**.
- [x] **Type bug from first deploy attempt** fixed.
- [ ] **Run `npx netlify deploy --prod --build`** from the project folder when you want it live.
- [ ] **Add `https://thespacepit.netlify.app` to Sanity CORS** — at https://www.sanity.io/manage/personal/project/7vj6i0c4/api → "CORS origins" → Add → paste the URL → toggle "Allow credentials" → Save. (Required only for /studio to work on the deployed URL — public site works without it.)
- [ ] **Eventually: real domains.** `nickhook.com`, `thespacepit.com`, `calmandcollect.com` — Vercel/Netlify rewrites map them to `/nick-hook`, `/`, `/calm-collect`. ~$12/yr each, 10 min to wire up.

---

## 🎯 active strategic push — Move-centric product line

_Promoted from "v2 ideas" 2026-05-12. Move is Nick's main instrument + the scene is hot — strongest entry point for the spacepit product line. Plan lives at [PACK_PLAN.md](./PACK_PLAN.md)._

- [ ] **FREE pack — "Nick Hook Move Sessions — Starter 5"** — Nick has 5 sessions already done. Needs: pick the 5, host the ZIP, add Sanity Pack entry with `access: free` + `gear: Ableton Move`. Becomes the lead magnet for newsletter capture.
- [ ] **PURCHASE pack — "Nick Hook Song Starters — 32 Move Sessions"** — premium product, $39-79. Move project files + Ableton Live ports + Drift patches + per-kit videos + stems bonus. Open question: how many of the 32 kits does Nick already have ready? Determines curation vs production effort.
- [ ] **Move + Note workflow video series** — content engine. ~30s vertical for social, longer YouTube breakdowns. Each demo video also doubles as a pack preview.
- [ ] **Sales channel decision** — Gumroad-now-migrate vs wait-for-Shopify-spacepit-store. Trade-off in PACK_PLAN.md.

## 🧠 ideas parked for "v2"

Nothing on the critical path. Captured here so we don't forget.

- **Custom audio player** — a spacepit-themed in-page player (vs. just the Bandcamp embed). Bigger lift, lower priority unless the brand demands it.
- **Digital twin rooms** — playable in-browser approximations of your gear (TR-808, SP-1200, EMT 250). Multi-month build.
- **Production credit detail pages** — each `/credits/[slug]` becomes its own page with the story, video clips, audio examples. Right now they're a table.
- **Show detail pages** — same pattern for individual shows.
- **A "now listening" widget** that pulls your most recent Spotify play and shows it somewhere. Cute, not load-bearing.
- **OG / social meta images** for each release / mix / era so iMessage + Twitter previews look right.
- **Real domain mapping** via Vercel/Netlify rewrites (nickhook.com, etc.).
- **Nick's published writing on RA** — 4 reviews authored BY Nick (Machinedrum *Movin' Forward* 2015, Cardopusher/Nehuen *Split 01* 2012, plus 2 reviews of his own 2004 *Burn Out Baby* EP). Not press *about* him — his journalism. Could become a `byline` content type or sub-category on `/nick-hook` someday.

---

**bottom line right now:** the site is in a strong, real state. The biggest wins from here come from **photos + missing URLs**, not from more code. Everything else can be filled in via /studio whenever you have time.

---

## key

- 🟢 **solo** — claude can do this, no input needed. just gets done.
- 🟡 **small input** — < 5 min from you. URL, file, yes/no, paste-back.
- 🔴 **bigger ask** — real time investment. signup, download, multi-step.
- 📦 **deploy** — netlify / domain / CORS / env-var work to ship.
- 🎯 **active push** — the current strategic bet. one section at a time.
- 🧠 **v2** — captured so we don't forget, but not on the critical path.
