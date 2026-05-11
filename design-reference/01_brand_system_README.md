# Nick Hook / thespacepit / Calm + Collect — Design System

_one world, three doors._

This design system covers **Nick Hook's** universe:

1. **Nick Hook** — the artist/producer porthole. Gold-record producer (RTJ Cuatro, Old English), DJ, engineer, Teenage Engineering artist-mentor. Brooklyn → Medellín.
2. **thespacepit** — the studio + YouTube channel + Discord community where gear demos, live jams, and sessions happen. Physical space in Brooklyn with a garden annex in Medellín.
3. **Calm + Collect** — the record label Nick co-runs with Gareth Jones. Artists: Nick Hook, Spiritual Friendship, Electrogenetic, Super Hero Killer, Sinister Dane, Quazzy. Sub-label **Calllm** for ambient/chakra drone work.

These are three doors into the same house. The design system treats them that way: **unified skeleton** (type, grid, voice), **differentiated color & motif** per property.

---

## Sources & inputs

- **User-supplied:** Calm + Collect animated heptagon mark (`uploads/logo_files-1777003094196.gif`, now at `assets/logos/calmcollect-mark.gif`).
- **User-supplied EPK:** `uploads/Copy of ENGLISH VERSION NICK HOOK EPK.pdf` — credits, press quotes, live-catalogue copy. Text extract in `assets/epk-text.md`.
- **Outstanding:** Record covers with "fontwork" Nick mentioned — couldn't upload; re-attach when possible.
- **Existing web presence:** [nickhook.bandcamp.com](https://nickhook.bandcamp.com/), [calmcollect.bandcamp.com](https://calmcollect.bandcamp.com/), [youtube.com/@thespacepit](https://www.youtube.com/@thespacepit).
- **Voice sample (from user):** _"pull up to thespacepit. grab some samples hear some songs join the discord we out here"_
- **Voice samples (press):** Sound on Sound Talkback interview; Fool's Gold artist page ("NYC's waviest resident"); EPK press pulls.

### Credits (from EPK)
- **Productions:** Run The Jewels (RTJ Cuatro — co-exec producer, RIAA Gold), Azealia Banks, 21 Savage, Young Thug, Freddie Gibbs, A$AP Ferg, Gangsta Boo, D Double E, Lido Pimienta, Akapellah, Machinedrum (Vapor City), Grand Theft Auto soundtrack.
- **Performances:** Movement Festival · Sónar · Moogfest · Medellín Music Week · MoMA PS1 · Boiler Room · Fool's Gold Day Off · Hopscotch · Pitchfork Festival.
- **Collaborations:** Teenage Engineering (artist mentor) · Native Instruments · Moog · Serato · Ableton · Roland · Eventide · Splice · Red Bull Music Academy · Vice/Noisey · Rockstar Games.
- **Press:** Pitchfork, Spin, Fader, Sound on Sound, Fact, Billboard, Rolling Stone en Español, Nowness, Vice, XLR8R.
- **Key pull quotes:**
  - _"Nick Hook is a ginger king."_ — El-P, Pitchfork
  - _"It's a mentality that's made him one of New York's most in-demand producers."_ — Fact Magazine
  - _"A renowned producer straddling the worlds of hip-hop and alternative music."_ — Sound on Sound
  - _"Hook's collaborative spirit tends to bring out the best in him."_ — Pitchfork
- **Live show:** "Nick Hook: Live Catalogue" — dynamic audiovisual experience pulling from his genre-defying catalog.
- **Booking:** coleman@smooth-loop.com

Treat this README as the front desk. Read it first; everything else branches from here.

---

## Index

| File / folder | What's in it |
|---|---|
| `README.md` | You are here. Context, content fundamentals, visual foundations, iconography. |
| `SKILL.md` | Agent-Skill entrypoint — machine-readable summary of this system. |
| `colors_and_type.css` | All color + typography tokens as CSS custom properties. Import this first. |
| `fonts/` | Webfont files (woff2). See type section for substitution notes. |
| `assets/logos/` | Logos for Nick Hook, thespacepit, Calm + Collect (+ Calllm sub-label). |
| `assets/icons/` | Iconography — Lucide set linked from CDN + a couple of brand glyphs. |
| `assets/textures/` | Grain, paper, tape, xerox overlays. |
| `preview/` | Design System cards — one card per token/component/specimen. |
| `ui_kits/nickhook/` | Artist portfolio site kit. |
| `ui_kits/spacepit/` | Studio + YouTube/Discord community hub kit. |
| `ui_kits/calmcollect/` | Record label kit (catalog, artists, releases). |

---

## Content Fundamentals

### Voice

**Lowercase, imperative, communal.** Nick talks the way he texts. No ceremony, no capital letters at the start of sentences, no Oxford commas, rarely full stops in short copy — line breaks do the work instead. When he does use punctuation, he leans on ellipses and em-dashes. Think group-chat, not press release.

Example (from user): _"pull up to thespacepit. grab some samples hear some songs join the discord we out here"_

### Casing

- **Default to lowercase** for body copy, UI labels, button text, CTAs, headings.
- **ALL CAPS** for display headlines, section headers, and tracklists on record covers. This is the NYC fly-poster/mixtape register.
- **Title Case is for establishment language** (legal, credits, "Executive Producer") and feels slightly foreign to the brand — use it sparingly.

### Person

- **"we"** for thespacepit (it's a crew, a community). _"we out here"_ / _"we in the studio"_ / _"we built this"_
- **"nick"** or **"i"** for the artist porthole. First person, lowercase.
- **"calm + collect"** speaks as a label collective — more "we" than "I", more mission statement than personal.
- **"you"** = the reader/listener, always. Direct address. _"pull up"_ / _"run it back"_ / _"tap in"_

### Vibe words

care · gear · vibes · community · session · pull up · tap in · run it · wave / waviest · the fam · lineage · teachers / mentors · open door · grain · analog · drone · chakra · spacepit · big ears · stay high · redistribute

### Phrases to lift

- "pull up"
- "tap in"
- "we out here"
- "the only thing that matters is that you care"
- "stay high"
- "big ears"
- "the fam"
- "see u in the pit"

### Phrases to avoid

- "Elevate your workflow" / "Unlock" / "Empower" — no SaaS verbs.
- "Sonic journey", "soundscape", "curated" — no music-press clichés.
- "Discover" as a button label. Say _"dig in"_ or _"hear it"_ instead.
- Corporate apologetics ("We strive to...", "Our mission is to..."). Just say the thing.

### Emoji

**Yes, constantly.** Part of the voice. A caption-style sprinkling, the way Nick posts on IG. The house set:

🌱 (garden / grow) · 🔊 (gear / sound) · 💿 (records) · 🎛️ (gear) · 🔥 (the track is cool) · ✨ (magic moment in a session) · 📼 (tape / mixtape energy) · 🌈 (chakra / Calllm / ambient) · 🪐 (space / spacepit) · ☁️ (calm) · 🤲 (gratitude / "the fam") · 💚 (love)

Rules:
- 1–2 per sentence, never a wall.
- Emoji can stand in for a period. _"we out here 🌱"_
- Never on formal credits or legal copy.

### Microcopy patterns

| Need | Say |
|---|---|
| Primary CTA | _"pull up"_ / _"tap in"_ / _"hear it"_ / _"listen"_ |
| Join Discord | _"join the discord"_ |
| Email signup | _"get on the list"_ / _"mail the pit"_ |
| Error state | _"something broke, try again in a sec"_ |
| Empty state | _"nothing here yet. check back."_ |
| Loading | _"cooking..."_ / _"loading..."_ |
| 404 | _"this one's not in the crate"_ |

---

## Visual Foundations

### Overall feel

Three influences colliding:

1. **NYC fly-poster / mixtape** — heavy condensed caps, xerox grain, DJ-flyer energy, tight kerning, stacked type.
2. **Analog studio** — vintage gear patinas, warm lamp yellows, tape labels, knob UI, LED reds.
3. **Teenage Engineering minimal** — monospace numerals, catalog/spec-sheet rigor, a lot of white space as counterpoint to the heavy type. This is the _Calm_ in Calm + Collect.

The system swings between these poles. Nick's own pages lean mixtape; Calm + Collect (especially Calllm) leans TE-minimal; thespacepit sits in the middle — studio gear energy with mixtape typography.

### Color

**Core neutrals** (shared by all three properties):
- `--ink`: `#0B0B0B` (not pure black — it's slightly warm)
- `--paper`: `#F4EFE6` (warm cream, xerox-paper feel)
- `--paper-2`: `#E8E2D4` (one step darker, for cards on paper)
- `--grain`: rgba(11, 11, 11, 0.04) noise overlay

**Per-property accent:**
- **Nick Hook** → `--redline: #E83A1C` (tape-label red / LED / fly-poster red)
- **thespacepit** → `--lamp: #F2B705` (incandescent lamp amber)
- **Calm + Collect** → `--collect: #0E4B3A` (deep studio plant green)
- **Calllm** (sub-label) → `--calllm: #C9B9E8` (soft lavender, chakra-adjacent)

**Chakra palette** (for Calllm drone releases, one per release):
- root `#9B1B1B` · sacral `#E2651A` · solar plexus `#F2C84B` · heart `#3E8E5A` · throat `#2F6FB3` · third eye `#4B2E83` · crown `#E3D4F2`

Full tokens in `colors_and_type.css`.

### Typography

- **Display / headlines:** a heavy condensed grotesque — per user direction, NYC rap / fly-poster register. Using **Antonio** (Google Fonts) as the primary bearer; also ships with **Anton** as fallback. ALL CAPS, tight tracking, occasional diagonal lockups.
- **Body:** a warm humanist serif (for long-form — interviews, liner notes) and a clean neo-grotesque sans (UI, labels). Using **Instrument Serif** + **Inter**.
- **Mono / numerals:** **JetBrains Mono** for catalog numbers, timecodes, BPMs, tracklists. Always tabular numerals.

> **Substitution flag for the user:** Since no custom font files were provided, all three of the above are Google Fonts nearest-matches. If Nick has a bespoke display face used on his record covers (the "fontwork" he mentioned), drop the files into `fonts/` and update `colors_and_type.css`. Antonio is very close to the condensed-grot family (Alternate Gothic / Trade Gothic Condensed / Bureau Grot Condensed) that dominates mixtape/poster typography.

### Grid & spacing

- **Baseline:** 8px. All vertical rhythm snaps to multiples of 8.
- **Max content width:** 1280px. Hero/marketing content can bleed to edges.
- **Gutters:** 24px desktop, 16px mobile.
- **Rigor:** thespacepit and Calm + Collect pages use a visible 12-col grid (rules, catalog-style alignment). Nick Hook pages break the grid intentionally — collage, rotated elements, overprint.

### Backgrounds

- **Default:** `--paper` (warm cream) for Calm + Collect and thespacepit.
- **Nick Hook artist pages:** `--ink` (near-black) with occasional `--redline` fields. Full-bleed photography allowed; tint it warm.
- **Calllm releases:** full-bleed chakra-color gradient, very soft, long radial.
- **Grain overlay:** subtle noise SVG on `--paper` surfaces at ~4% opacity. Mandatory on hero sections.
- **Never:** bluish-purple tech gradients, glassmorphism, blurred orbs.

### Imagery

- **Warm and grainy.** Tungsten lamp cast, slight grain, unafraid of low light.
- Studio photography with visible cables, gear, plants, hands. Nick's presence (hands on knobs, ambient-not-posed) > staged product shots.
- When ambient/Calllm: watercolor textures, chakra color washes, out-of-focus foliage.
- Never: stock photography, AI-gen imagery, clean product renders against white cyc.

### Animation

- **Measured, not bouncy.** No spring/overshoot. Ease-out on everything (`cubic-bezier(0.2, 0, 0, 1)`), 180–280ms.
- **Exception:** the Calm + Collect heptagon mark rotates slowly (~8s/rotation), like a loop pedal or a turntable at rest. This is the one piece of constant motion.
- Hover states: `opacity: 0.7` (fast fade) OR invert fg/bg on chip-style elements — never a drop-shadow lift.
- Press states: `transform: translateY(1px)` + instant. Mechanical click, not squishy.
- Scroll-triggered animation: sparingly, and only fade-in-from-y+8px. No parallax, no reveals-with-masks.

### Borders, shadows, radii

- **Borders:** `1px solid var(--ink)` — present on cards, inputs, buttons. Strong, un-subtle. No hairlines.
- **Shadows:** mostly absent. When used: a hard offset shadow (`4px 4px 0 var(--ink)`), not a soft bloom. Think risograph / sticker.
- **Inner shadows:** never — we're not making 3D buttons.
- **Radii:** `0` (default / sharp) or `999px` (pill, for tags and chips). No 8px-generic-card radius.

### Cards & containers

- Card = **paper-2 background + 1px ink border + 0 radius + hard offset shadow** on hover.
- Section dividers: thick 2px ink rules, not hairlines.
- Tag/chip: 1px ink border, pill radius, uppercase mono, tabular numerals when numeric.

### Transparency & blur

- **Blur:** almost never. The one exception is a sticky nav bar with `backdrop-filter: blur(8px)` when scrolled over photography.
- **Transparency:** used for grain overlays (4%), for faint watermark marks (8%), for press-state button feedback. Not used as a decorative style.

### Protection / gradient scrims

- Only over full-bleed photography, only at the bottom edge, only as `linear-gradient(to top, rgba(11,11,11,0.7), transparent 40%)`.
- Preferred alternative: a solid capsule (`--ink` bg, `--paper` text) sitting over the image. More confident than a scrim.

### Layout rules & fixed elements

- Top nav: 64px tall, sticky, paper background with bottom 1px ink rule.
- Footer: paper-2 background, includes the rotating heptagon mark, "see u in the pit" signoff.
- Mobile: single column, headlines scale from 72px → 44px, gutters 16px. The condensed type holds at small sizes better than you'd expect.

### Don'ts

- No bluish-purple gradients
- No rounded 8/12/16px "tech" radii
- No soft drop shadows
- No Inter for display (use Inter only for UI body)
- No emoji cards / emoji as decorative fill
- No hand-drawn SVG icons (copy real ones in)
- No colored-left-border-accent cards
- No "elevated workflow" corporate verbs

---

## Iconography

**Primary set:** [Lucide](https://lucide.dev/) (24×24, 1.75px stroke) — linked from CDN. Chosen because its stroke weight sits well next to the condensed headlines (sturdy, not thin-and-decorative) and it has good coverage for music-app needs (play, pause, disc, headphones, mic, broadcast, etc.).

```html
<!-- how we load lucide -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<i data-lucide="play"></i>
```

**Substitution flag for the user:** No custom icon system was provided. If you'd rather use Phosphor (friendlier, rounded) or a hand-made set, swap it in at `assets/icons/` and update the kit components. Lucide is a reasonable default, not sacred.

**Brand glyphs:**
- `assets/logos/calmcollect-mark.gif` — the animated heptagon. Use this live (GIF) on hero placements; use the PNG still for favicons/app icons.
- The heptagon is the **universal motif** across all three properties — it's the seal, used small at footer sign-offs, in loading states, as a bullet character in lists.

**Emoji** — yes, part of the voice. See Content Fundamentals → Emoji.

**Unicode characters as UI chrome:**
- `+` → the brand plus. _Calm + Collect_ always uses the literal ` + ` with spaces, never `&` or `and`.
- `·` → middle dot, separator in metadata (_"brooklyn · 2025 · gold"_)
- `→` → used for links and CTAs, never `>` or →
- `▲` `▼` → sort controls, play triangle. We use the filled solid triangle as the play icon in label pages, not a rounded-edge Lucide play.
- `/` → separator in the header lockup (_"nick hook / thespacepit / calm + collect"_)

**SVGs:** all assets are copied into `assets/` — never hand-roll them in a design file. If an icon isn't in Lucide, draw it once, save it, reuse.

---

## Sub-brand relationship

Chose: **shared skeleton (grid, type, voice) with differentiated color and motif per property.** Reasoning: the three properties are distinct but they all speak in Nick's voice and share customers. A total split fragments the audience; a total merge loses what makes Calm + Collect feel like a proper label and not a personal blog.

| | Nick Hook | thespacepit | Calm + Collect |
|---|---|---|---|
| Accent | redline `#E83A1C` | lamp `#F2B705` | collect `#0E4B3A` |
| Background | `--ink` (dark) | `--paper` (cream) | `--paper` (cream) |
| Type register | mixtape — collage, rotated, overprint | studio — neat, catalog-like | label — editorial, serif body |
| Motif | tape label / redline | lamp glow / knob / waveform | rotating heptagon / catalog number |
| Voice | "i / nick" | "we" | "calm + collect presents" |

---

_this is a working system. if you see something that doesn't feel like nick — flag it, we fix it._
