# site · master to-do

Last updated: 2026-05-20 — `/lab` v0 with 2 rooms, WAV export, guided lessons + Web MIDI all shipped.

## 🟠 shipped 2026-05-20 — the lab (rooms 1 & 2 + WAV + lessons + MIDI)

- [x] **Guided lessons** — generic Lesson framework (`_lib/lesson-types.ts`, `_components/LessonPanel.tsx`). Each lesson is a sequence of steps with a `check(state)` function; UI auto-advances when the user actually does the thing. Lamp-amber panel docks above the machine, hints appear after 7s of inactivity.
  - **909 · Build a Chicago 4×4** (5 steps): kick on 1 → 4-on-the-floor → backbeat clap → offbeat open hat → press play. Starts from a cleared grid + blank preset.
  - **Moog · Dial in Flash Light** (5 steps): square wave → sub octave → close cutoff → envelope amount + filter ADSR → play a note. Loads from "init" patch.
- [x] **Web MIDI in (Moog)** — auto-detects MIDI inputs, dropdown picker in the patch bar. Hardware keyboard plays the engine with legato hold/release. Listens to statechange events so plug/unplug refreshes the list.
- [x] **Web MIDI out (909)** — auto-detects MIDI outputs, dropdown in the transport. Sequencer also sends GM-standard 909 notes (BD=36, SD=38, RS=37, CP=39, CH=42, OH=46, LT=43, MT=47, HT=50) on channel 10 when playing — drives an external drum module or DAW track.
- [x] **Web MIDI in (909) + GM drum map** — incoming drum notes route to voices via the GM table (with neighbor tolerance for kit variants). So Move pads (or any pad controller / sequencer) trigger the 909 in the browser.
- [x] **MIDI clock sync (909)** — INT/EXT toggle in the transport. INT: browser is master, sends `0xF8` ticks + start/stop transport to selected output. EXT: external clock (Move / Live / DAW) drives the 909 sequencer — every 6th `0xF8` advances a 16th. BPM is detected from inter-tick interval with an EMA + shown in the transport. Start/Continue/Stop messages also wire to the sequencer.
- [x] **Ableton Link (909, via local bridge)** — third SYNC option ("LINK") in the transport. Native Link doesn't run in browsers (no UDP multicast), so we ship `scripts/link-bridge.mjs` — a small Node script that runs Link locally and forwards state to the browser over WebSocket on `localhost:17001`. Status indicator shows peers + BPM when connected. To use: `npm install abletonlink ws` then `npm run link-bridge` in a terminal. Carabiner fallback path documented in the script header for if the native module won't build. UI gracefully shows "○ bridge off" in redline when not running.

- [x] **Three-mode export from /lab/909 (catering Move + KO II users)** — single button became three:
  - **WAV** — single mixed loop (was already there)
  - **STEMS** — per-voice WAV files isolated to their part of the pattern, packaged as a ZIP for DAW workflow
  - **KIT** — per-voice one-shot WAVs (single hit, ~2s) numbered 01–09 + `loop-Xbpm.wav` + `kit.json` manifest + `README.txt`, packaged as a ZIP. Drop the `samples/` folder onto move.ableton.com or onto a KO II in USB drive mode and the pads come up in order. ZIP packaging via `fflate`. Manifest shape echoes Nick's `manifest.template.json` from the sample bank (Move + ep_133 slots).

- [x] **`/lab` route + world map** — synth-school index with 7 rooms staged (909 + moog live, sp1200 NEXT UP, dx7/sid/buchla/modular SOON). Each room card has paradigm, scene, era, hero line, blurb, 3 reference records. Lamp-amber accent, hard-offset shadows, links straight into rooms when live. Added to spacepit TopNav between `/listening` and `/packs`. Counts on the hero are dynamic from `rooms.ts`.
- [x] **`/lab/909` room — TR-909 in the browser** — raw Web Audio synthesis (no Tone.js, no samples). 9 voices modeled as analog circuits: BD (sine + pitch sweep + click), SD (2-tone osc + bandpassed noise), LT/MT/HT (triangle + pitch env), RS, CP (3 quick bursts + tail), CH (short hp/bp noise), OH (long hp/bp noise). Each voice tunable via per-voice knobs (level / tune / decay / tone / snappy).
- [x] **16-step grid sequencer** — lookahead scheduler on AudioContext clock, BPM 60–200, swing 0–50%, current-step playhead highlight, accent on downbeats. Click to toggle steps.
- [x] **5 preset patterns** — Chicago 4×4, Detroit drive, Acid shuffle, Boom-bap 909, Blank slate. Each ships with a story line + bpm + swing + steps.
- [x] **3 reference YouTube embeds** — Mystery of Love, Strings of Life, Acid Tracks, with a "what to listen for" note on each. (YT IDs from memory — Nick should verify they're the right uploads.)
- [x] **Tap-to-power-on overlay** — browser autoplay-policy gate. Knob component with drag-to-edit, double-click reset, scroll-wheel nudge, Shift for fine.
- [x] **Keyboard shortcuts** — 1–9 trigger voices, Space play/stop.
- [x] **WAV export from /lab/909** — `OfflineAudioContext` render of N bars (1/2/4/8) at the current per-voice tuning + swing. Filename includes preset id + bpm + date. Pure 16-bit PCM, browser download.
- [x] **`/lab/moog` room — Minimoog-style monosynth in the browser** — single-voice subtractive: saw/square/triangle/sine + sub-octave square, 4-pole-ish lowpass (2 cascaded biquads) with resonance + envelope amount, separate filter ADSR and amp ADSR, glide, master vol. Wood-panel UI. 2-octave on-screen keyboard + computer keyboard (asdfghjkl + wetyu, z/x for octave shift). 6 presets: Flash Light bass, Lead saw, Stevie square, Cabaret drone, Acid bass, Init. Story page + 3 reference YouTube records.

## 🟠 next on the lab punch list (drafted into each room's "what's next" section)

- [ ] **Export to Ableton .als** — gzipped XML, totally doable. Drop your sequence + per-voice levels straight into a Live set.
- [ ] **Export to Move kit** — render each voice as a separate one-shot at current settings, package as a Move kit.
- [ ] **Pattern memory** — save your own patterns alongside the canon presets (local storage v0, Sanity later for cross-device).
- [ ] **Web MIDI out** — route the sequencer to a connected Move / TE rig as MIDI clock + note triggers.
- [ ] **Accent / shuffle / flam per voice** — the real 909 had them, the model should too.
- [ ] **Lesson progression** — 5 guided steps from kick → full pattern, unlocking knobs/voices as you go. Currently the whole machine is open from step zero.
- [ ] **"Demonstrate" mode** — type "phuture acid kick" → the app dials the patch and narrates what it did. This is the killer feature.

- [x] **SP-1200 room (room 3)** — 12-bit sampler at `/lab/sp1200`. EngineSP1200: per-pad sample player with WaveShaperNode 12-bit quantization curve + 13kHz lowpass + per-pad pitch via `playbackRate`. 8 pads, drag-drop WAV onto any pad to load. Pads 1–4 pre-seeded with one-shots rendered offline from the 909 voices on first power-on. Own sequencer (`SequencerSP`) at the SP's default tempo (92 bpm, 18% swing). Starter pattern loaded.

- [x] **DX7 room (room 4)** — 4-operator FM synth at `/lab/dx7`. EngineDX7: 4 OscillatorNodes wired into 3 algorithms (cascade / parallel / fan). FM via `osc.connect(gain).connect(carrier.frequency)`. Presets: bell, e-piano, slap bass, breath pad, init. 2-octave keyboard + MIDI in.
- [x] **SID room (room 5)** — 3-voice chip synth at `/lab/sid`. EngineSID: 3 OscillatorNodes (with optional noise via AudioBufferSourceNode), shared multimode BiquadFilter, per-voice ADSR, chip-tune arpeggiator (one voice cycles through 3 intervals at up to 50Hz). Presets: hubbard-lead, galway-pad, demoscene-bass, noise-hat, init.
- [x] **Buchla room (room 6)** — west coast at `/lab/buchla`. EngineBuchla: complex osc (osc1 FM-modulates osc2), WaveShaperNode for shape, LPG (lowpass + amp share one envelope), Source of Uncertainty (slow random voltage modulates timbre). 4 touch plates (bonk/swell/pluck/drone) instead of keyboard. Presets: silver-apples, ciani-drone, ks-percussive, init.
- [x] **Modular room (room 7)** — patch programming at `/lab/modular`. EngineModular: 6 modules (VCO1, VCO2, LFO, VCF, ENV, VCA), 3 switchable patch programs (basic / fm-lead / pulse-pad) that re-wire the audio graph. Same modules, completely different instruments depending on the patch. 2-octave keyboard.

**ALL 7 ROOMS LIVE — 2026-05-20.** Lab landing dynamically shows "7 rooms planned · 7 rooms live."

## 🟠 still to do in the lab (post-MVP)

- [ ] Add WAV / STEMS / KIT export buttons to Moog + SP-1200 + DX7 + SID + Buchla + Modular (mirrors the 909 export — render offline, encode, download).
- [ ] More lessons per room — currently only 909 + Moog have one each. Each room could get 2–3 guided builds.
- [ ] Per-room Web MIDI input for the synth rooms that don't have it yet (SID, Buchla, Modular).
- [ ] "Favorite bands" mode — tag a band, the system surfaces the relevant techniques across whichever rooms cover them.
- [ ] Drag-to-patch live cables in the modular room (currently only 3 pre-built routings).
- [ ] Live Link (true Ableton Link via local helper) — bridge already exists as `scripts/link-bridge.mjs`; user needs to `npm install abletonlink && npm run link-bridge` to enable.

---

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
- [x] **Branded 404 page** — `app/not-found.tsx` replaces the default Next.js "404 / This page could not be found." Big lamp-amber "you wandered out of the pit." display, shows the broken path, three world CTAs (the pit / nick / c+c), jump-offs row + branded footer. _(2026-05-18.)_
- [x] **/press nested-`<a>` hydration fix** — `PressTile` was wrapping the whole card in an article anchor with chip Links inside (`<a>` inside `<a>`). Converted to the stretched-link pattern: outer wrapper is a `<div>`, article URL is an `absolute inset-0 z-[1]` anchor, chip Links sit at `relative z-[2]` so they capture their own clicks. Console errors gone. _(2026-05-18.)_
- [x] **/listening Discogs covers — `referrerPolicy="no-referrer"`** — Discogs's `i.discogs.com` CDN sometimes 403s or returns blank when it sees a cross-origin Referer. PressGrid already does this fix; ListeningClient was missing it, so first-paint covers occasionally rendered as empty boxes. _(2026-05-18.)_
- [x] **/partners no-logo fallback upgrade** — bare 36px brand name swapped for a typographic masthead: small "◌ thespacepit ×" mono eyebrow + huge `clamp(34px, 7vw, 64px)` display name. Cards without uploaded logos (Eventide, etc.) now read as intentional nameplates instead of "logo missing". Doesn't replace the real-logo task below — that still wants actual PNG/SVG drops. _(2026-05-18.)_
- [x] **/eras/red-bull-rbma — wired** — Nick pointed at the original RBMA 2011 playlist (`PLMXEK…M29b`); turns out RBMA wiped it when they shut down in 2019. Found Nick's own RBMA 2011 footage on his channel (`DfVv6EaEDJA`) + inventoried 11 surviving Madrid 2011 lectures/sessions on RBMA's still-live channel (Gareth Jones, Francesco Tristano, Young Guru, Erykah Badu, Tom Zé, Andrea Balency, plus the Tormenta Tropical + Sound In Colour nights). Created `scripts/import-rbma-playlist.ts` (idempotent), wrote 12 video docs all `relatedEra` → `project-red-bull-rbma`, pinned Nick's video as `featured`, patched era doc (`yearStart=2011`, `youtubeUrl` = Nick's video). Story stub written with the "rbma shut down, here's what survived from my year" angle. Full archive notes in `memory/project_rbma_archive.md`. _(2026-05-18. CORRECTED later same day: the playlist IS live via YouTube API; reimported the real 18-video playlist + added Understand still as era cover + Rhythm and Vines NYE 2011→2012 liveDate.)_

- [x] **CZ catalog deep buildout** — 8 external releases added to bridge gaps in the Cubic Zirconia discography that were missing: Pantero 666 X Lova (CZ Remix), Egyptrixx Only Way Up (CZ Remix) NS002, Yuksek Off The Wall (CZ Remix) — bonus fix, Hoes/Reclash white label NSWL005 (CZ × Bok Bok split), Brownswood Bubblers Seven (Gilles Peterson, CZ × Bilal "Night Or Day"), Spoek Mathambo Gwababa (CZ Remix), Greenmoney Into You (CZ Remix), Egyptrixx "How Tidal" 2025 (track 4 is reverse-direction Egyptrixx-remix-of-Josephine). All linked into `project-cubic-zirconia.releases[]` so /eras/cubic-zirconia surfaces them too. Spoek Mathambo also added as vocal feature on LDCC002 Black & Blue credits. _(2026-05-18.)_

- [x] **The Rap Monument added to catalog** — major Nick Hook production credit that was completely missing. 42-minute, 36-rapper Noisey × Hennessy posse cut (2014-12-18). Producers: Hudson Mohawke × Nick Hook × S-Type. All 36 rappers in the track features string. 4 new press docs created (Pitchfork, Stereogum, Fader, Complex) — Okayplayer + NEST HQ were already in the archive. _(2026-05-18.)_

- [x] **Ben Klock 666 Wayz mystery solved** — Nick flagged a "ben klock song on the page" that didn't seem to belong. Tracked it to `release-discogs-1092696`, a corrupted bulk-import doc that was tagged as Ben Klock 2016 but Discogs ID 1092696 is actually The Jacksons "Walk Right Now" (1980). Deleted the corrupted doc + created `release-ext-mixmag-presents-ben-klock-2016`: the real Mixmag Presents Ben Klock CD (Nov 2016 issue), 42:48 mix featuring Nick's 666 Wayz (Instrumental) at track 4. Nick now properly credited as appearance. Memory note: `memory/project_ben_klock_mixmag.md`. _(2026-05-18.)_

- [x] **Era story stubs for 3 low-score eras** — RTJ 10th Anniversary, Gangsta Boo · live + studio, Nick Hook + DJ Earl Tour. Each got a 2-block draft in Nick's voice, refinable via /studio. _(2026-05-18.)_
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
- [x] **Brand logos** — all 14 brands at /partners now have real logos. Eventide/Serato/Fool's Gold/Vice from official sites; Moog/Native Instruments/Roland/Rockstar/Splice/TE from Wikipedia Commons SVGs; The Lot Radio + RBMA from their YouTube channel avatars. Backgrounds also landed for every brand. Pipeline: `scripts/enrich-brand-assets.ts`. _(2026-05-18.)_
- [x] **Brand featuredVideoUrl** — 10 brands now have a hero video pinned to their detail page: Ableton (One Thing: Beat It!), Boiler Room (Shenzhen set), Fool's Gold (Another Way music video), Moog (live w/ XY), Native Instruments (Sonic Hooks roundtable), RBMA (Nick's own 2011 footage), Roland (SP-404 Day), Serato (One Minute With Nick Hook), Teenage Engineering (KO II EP-133 walkthrough), The Lot Radio (his 2023 live set). Eventide already had one. Pipeline: `scripts/_find-brand-videos.ts` + `_patch-brand-videos.ts`. Splice + Noisey/Vice + Rockstar Games left unset — no high-confidence Nick-featuring video found on their channels. _(2026-05-18.)_
- [x] **Brand story stubs** — Ableton + The Lot Radio (the two brands with empty story arrays) got 3-block stubs each. Nick-voice, lowercase, easy to expand via /studio. Other brands already had stories. _(2026-05-18.)_

### Sanity Studio

- [ ] **Register `/studio` for editing** — go to `localhost:3000/studio` (or the deployed URL once we ship), click "Add development host," log in. Then everything (releases, brands, eras, mixes, studios, press) becomes editable via dashboard with no code edits.

---

## 🔴 needs your input — bigger asks

### Booking → Formspree

- [x] **Sign up at formspree.io** with your booking email → free tier covers ~50 submissions/month. _(Done 2026-05-18. Project "thespacepit" under thespacepit@gmail.com.)_
- [x] Generate an endpoint, paste it into `.env.local` as `NEXT_PUBLIC_FORMSPREE_ENDPOINT`. Booking forms switch from "open your email client" to real form submissions hitting Nick's inbox. _(Endpoint: `https://formspree.io/f/meedogjw`. Set on `.env.local` + Netlify production/deploy-preview/branch-deploy. All 5 booking forms on `/contact` + `/sessions` now POST directly.)_

### Newsletter (Mailchimp)

- [x] **Newsletter signup form built** — `NewsletterForm` component + `/api/newsletter` route, live on `/packs`. Returns a friendly 503 until keys arrive. _(Done 2026-05-12.)_
- [x] **Mailchimp API key + audience ID** → set `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` in `.env.local` and on Netlify. Form switches from "wiring up" to live signup with zero code changes. _(Done 2026-05-18. Audience under thespacepit@gmail.com, datacenter us9. Health check at `/api/newsletter` GET returns all backends green. Test signup `thespacepit+claude-test@gmail.com` landed in Sanity + Mailchimp.)_
- [x] **Add NewsletterForm to `/sessions`** — currently only on `/packs`. Sessions traffic from the socials push should also have a capture point. _(Done 2026-05-18. Custom heading "not ready? get on the list." with sessions-specific copy. source="sessions".)_
- [x] **Add NewsletterForm slot to Footer** — across-site capture surface. _(Done 2026-05-18. Compact dark band above the signoff row in `Footer.tsx`, rendered by default on all ~40 pages. Opted out the 5 pages that already render a NewsletterSection above the footer (`/packs`, `/packs/[slug]`, `/the-pit`, `/pop-up`, `/sessions`) via `newsletter={false}`. source="footer".)_

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
