# Handoff: Nick Hook Universe — Three-Site Build

## Overview

This bundle contains the design references for three connected websites under one design system:

1. **Nick Hook** — artist/producer portfolio (bio, releases, live show, press)
2. **thespacepit** — studio + YouTube + Discord community hub
3. **Calm + Collect** — record label site (catalog, artist roster, Calllm sub-label)

They share a skeleton (type, voice, grid, the rotating heptagon mark) and differ by accent color and motif. See `01_brand_system_README.md` for the full brand bible — content rules, voice samples, color tokens, type stack, "do's and don'ts."

## About the Design Files

The HTML/JSX files in this bundle are **design references** — high-fidelity prototypes built with React + inline Babel + plain CSS, intended to communicate look, feel, and content. They are NOT production code to ship as-is.

**Your job:** recreate these designs in the target codebase using its established patterns. If the project has no codebase yet, choose the framework that best fits a content-heavy editorial site with embedded YouTube + Discord widgets and an audio player — a typical good fit is **Next.js (App Router) + Tailwind + a CMS** (Sanity, Payload, or markdown via Contentlayer) for the catalog/release/event content. SvelteKit or Astro are also reasonable; avoid pure-Vite-SPA for SEO reasons.

The CSS tokens in `colors_and_type.css` should be ported directly into your framework — copy variables verbatim, then map them to Tailwind theme keys or your CSS-in-JS theme.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, and component composition are intended to be matched pixel-close. The one caveat: **fonts are Google Fonts substitutes** (Antonio, Instrument Serif, JetBrains Mono) standing in for the bespoke typeface(s) on Nick's record covers. If the real fontwork lands later, swap the families in `colors_and_type.css` and re-test display sizes — Antonio at 200px is the most exposed surface.

## Files in this bundle

| Path | What it is |
|---|---|
| `01_brand_system_README.md` | The brand bible — voice, colors, type, motifs, do's & don'ts. Read first. |
| `SKILL.md` | Compact summary you can drop into a system prompt. |
| `colors_and_type.css` | All design tokens. Port these into your codebase verbatim. |
| `assets/logos/calmcollect-mark.gif` | The animated heptagon mark (live use). |
| `assets/logos/calmcollect-mark.png` | Static heptagon (favicon, social meta). |
| `assets/epk-text.md` | EPK text excerpt — credits, press quotes, live-show copy. Source of truth for copy. |
| `preview/*.html` | Specimen cards (one per token group / component). Use as visual spec. |
| `preview/design-system-sheet-print.html` | Print-ready sheet of all preview cards. |
| `ui_kits/nickhook/` | Artist-site mockup: Hero, ReleaseGrid, LiveCatalogue, PressWall, FooterSignoff. |
| `ui_kits/spacepit/` | Studio-site mockup: Hero, VideoGrid, GearShelf, DiscordStrip, Footer. |
| `ui_kits/calmcollect/` | Label-site mockup: Hero, CatalogGrid, ArtistRoster, CalllmStrip, Footer. |

Each `ui_kits/<site>/index.html` is a runnable prototype. Open it locally in a browser and you can see the assembled page. Each `*.jsx` next to it is the source for one section.

---

## Screens / Views

### Site 1 — Nick Hook (`ui_kits/nickhook/index.html`)

Dark mode (`#0B0B0B` background, `#F4EFE6` text). Mixtape/fly-poster register.

**1. Top nav (sticky, 64px tall)**
- Background: `rgba(11,11,11,0.82)` + `backdrop-filter: blur(8px)`
- Bottom border: `1px solid #F4EFE6`
- Left: animated heptagon (22×22, 8s linear rotation) + three-door lockup with ` / ` separators. Active site (`nick hook`) in `#E83A1C`; inactive sites in `#E8E2D4`, link to sibling sites.
- Right: 4 nav links (`music · live · press · contact`) — JetBrains Mono, 11px, .12em letter-spacing, uppercase, `#E8E2D4`.

**2. Hero**
- Full-bleed dark, 96px top / 80px bottom / 32px sides padding.
- Top-right: small spinning heptagon + caption "BROOKLYN · MEDELLÍN · EST. 2011" (mono, 10px, .1em tracking).
- Eyebrow: `PRODUCER · DJ · ENGINEER · COLLABORATOR` in redline `#E83A1C` mono caps.
- Headline: "NICK / HOOK" — Antonio 700, `clamp(88px, 16vw, 220px)`, line-height .88, letter-spacing -0.02em. Second line ("HOOK") in `#E83A1C`.
- Tagline: Instrument Serif italic, `clamp(20px, 2.2vw, 28px)`, max-width 560px, color `#E8E2D4`.
- CTAs: two buttons, sharp corners (radius 0), 1px paper border. Primary filled redline `#E83A1C`, secondary ghost. Antonio 600, 15px, .04em tracking, uppercase, 12px/20px padding.

**3. Release Grid**
- Section heading row: eyebrow + h2 + "08 OF ~40 · SEE ALL →" right-aligned, 2px paper border under.
- Grid: `repeat(auto-fill, minmax(220px, 1fr))`, 16px gap.
- Card: 1px paper border, 14px padding, square cover at top (1px paper border), title in Antonio 700 22px, artist in Inter 12px `#C8C2B4`, three pill chips (cat #, year, format) in JetBrains Mono 10px.
- Hover: `translate(-3px, -3px)` + `4px 4px 0 #E83A1C` hard offset shadow. Transition 160ms `cubic-bezier(0.2,0,0,1)`.
- Cover art: solid color blocks per release with rotated -4° text overlay (placeholder until real art lands). Eight releases listed in `ReleaseGrid.jsx`.

**4. Live Catalogue**
- Full redline-red section (`#E83A1C` bg, paper text).
- Eyebrow: `🔊 A/V SHOW · 2026`.
- H2: "live catalogue" — Antonio 700, `clamp(48px, 9vw, 120px)`, line-height .9.
- Lede: Instrument Serif italic, max-width 680px.
- Date list: 4-column grid `100px 1fr 1fr 120px` per row. 16px vertical padding, 1px paper top border per row, last row also has bottom border. Date in tabular mono, city in Antonio 22px caps, venue in mono 11px caps with .08em tracking. Right-side ticket button: ink-black bg, paper border, Antonio 12px caps.

**5. Press Wall**
- Dark section, 64px padding.
- Eyebrow `THEY SAID`, h2 "the press."
- Grid: `repeat(auto-fit, minmax(280px, 1fr))`, 20px gap.
- Quote card: 1px paper border, 22px padding, vertical flex with 14px gap. Decorative `"` in Instrument Serif 60px redline at top, quote in serif italic 22px, source in mono 10px caps `#C8C2B4` at bottom.

**6. Footer**
- 48px padding, dark, 1px top paper border.
- Left: spinning heptagon (44×44) + "see u in the pit 🌱" (Antonio 32px caps) + "booking · coleman@smooth-loop.com" (mono 11px caps).
- Right: social links (mono 11px caps).

---

### Site 2 — thespacepit (`ui_kits/spacepit/index.html`)

Light mode (`#F4EFE6` paper, `#0B0B0B` ink). Lamp-amber accent `#F2B705`. Studio/catalog rigor.

**1. Top nav** — same structure as Nick Hook but inverted (paper bg, ink border, lamp-amber active state). Links: `videos · gear · discord · visit`.

**2. Hero**
- Eyebrow: pulsing redline dot (10×10, `sp-pulse` 1.4s ease-in-out infinite, opacity 1→0.3) + "LIVE · recording now · brooklyn" mono caps.
- H1: "pull up to thespacepit" — Antonio 700, `clamp(80px, 14vw, 200px)`, line-height .88. "thespacepit" rendered with `color: #F2B705` + `-webkit-text-stroke: 2px #0B0B0B` (lamp glow effect).
- Tagline: serif italic, max-width 640.
- 4-column stats strip: `214 videos posted · 38.4k fam on yt · 2.1k in the discord · 11yr since we started`. Antonio 40px numerals, mono 10px labels. 1px ink top border, ink right borders between columns.

**3. Video Grid (YouTube)**
- Filter chips: `all · gear · live · radio` — pill, 1px ink border, mono 10px caps. Active: ink fill, paper text.
- Grid: `repeat(auto-fill, minmax(280px, 1fr))`, 18px gap.
- Card: 1px ink border, 16:9 thumb area (color block placeholder), play button overlay (56×56 circle, 60% black, paper border, ▶ centered), duration tag in bottom-right (ink bg, paper text, mono 11px).
- Card body: 14px padding, title in Antonio 600 20px caps, meta in mono 10px caps.

**4. Gear Shelf**
- **Dark** section (the only one in spacepit) — `#0B0B0B` bg, paper text. Lamp-amber eyebrow.
- Spec table: full-width, mono 13px, tabular numerals. Columns: Unit (Antonio 20px caps name) · Type · Note (lighter color) · Status (with amber dot prefix).
- 7 rows of real gear (Roland TR-808 signed by Bruce Forat, EMT 250, OP-1 field, Octatrack mk2, Prophet '08, Akai MPC 2500, Manley mic).

**5. Discord Strip**
- Lamp-amber `#F2B705` background, ink text. 80px padding, 2px ink borders top + bottom.
- Two-column row `1.3fr 1fr` with 48px gap.
- Left: eyebrow + h2 "join the fam" (Antonio, `clamp(48px, 8vw, 120px)`) + lede + ink-filled CTA "join the discord →".
- Right: Discord-style panel — `#0B0B0B` bg, 1px ink border, 6px×6px hard offset shadow, mono font. Header line "online · 2,127 in fam" (with green dot pulse). 6 channel rows (`# general 814 active`, `# gear-chat 522`, etc.) with channel names in lamp-amber and counts in `#C8C2B4`, separated by `1px solid #3A362E`.

**6. Footer** — same template as Nick Hook, swapped to paper bg + "see u in the pit 🪐".

---

### Site 3 — Calm + Collect (`ui_kits/calmcollect/index.html`)

Light mode. Collect-green accent `#0E4B3A`. Editorial/label register.

**1. Top nav** — paper bg, collect-green active state. Links: `releases · artists · calllm · shop`.

**2. Hero**
- Two-column row: text left, **240×240 spinning heptagon** right.
- Eyebrow: `◆ A RECORD LABEL · EST. 2013 · NY → MDE` (mono caps, collect-green).
- H1: "calm + collect" — Antonio 700, `clamp(72px, 13vw, 200px)`, line-height .88. The "+" is `font-weight: 400` and `color: #0E4B3A` (collect green) — important detail.
- Lede: serif italic, max-width 620.
- Meta strip: `52 releases · 5 artists · 1 sub-label · calllm` in mono caps.

**3. Catalog Grid**
- Catalog-table layout, not card grid (that's the editorial choice).
- 6-column grid: `100px 1.5fr 1.5fr 90px 60px 100px` (Cat # · Title · Artist · Format · Year · Listen button).
- Header row: mono 10px caps `#3A362E`. Body rows: 1px ink bottom border per row, 18px vertical padding.
- Cat # in mono 12px, Title in Antonio 600 22px caps, Artist in Inter 14px, Format in mono 11px caps, Year in tabular mono. Listen button: paper bg, 1px ink border, Antonio 12px caps "▶ listen".
- 8 catalog entries listed (`C+C–001` through `C+C–052`).

**4. Artist Roster**
- **Collect-green** `#0E4B3A` background, paper text. Calllm-lavender eyebrow.
- Grid: `repeat(auto-fill, minmax(240px, 1fr))`, 20px gap.
- Card: 1px paper border, 20px padding, vertical flex 8px gap. Name in Antonio 700 28px caps, city in mono 11px caps lavender, note in serif italic 16px `#E8E2D4`.
- 6 artists listed.

**5. Calllm Strip (sub-label feature)**
- Background: 7-color **chakra gradient** (root red → crown lavender) at 120deg, with `rgba(11,11,11,0.5)` scrim and `backdrop-filter: blur(2px)`.
- 80px padding, 2px ink borders top + bottom.
- Eyebrow `◐ SUB-LABEL · AMBIENT / DRONE` lavender caps.
- H2 "calllm" — Antonio 700, `clamp(56px, 10vw, 160px)`.
- 7-column chakra grid below: each cell shows chakra name (Antonio 22px caps) and key (`C, D, E, F#, G, A, B`). Background = chakra hex; text auto-flips to ink on light chakras (yellow + lavender), paper on dark.

**6. Footer** — paper bg, "stay high 💚" signoff.

---

## Interactions & Behavior

- **Heptagon mark.** Continuously rotates at 8s/full-revolution, linear. Universal across all three sites — nav, hero, footer. Implementation: `@keyframes spin { to { transform: rotate(360deg); } }` + `animation: spin 8s linear infinite`.
- **Hover (cards & rows).** 160ms `cubic-bezier(0.2, 0, 0, 1)`. Transform = `translate(-3px, -3px)` + hard offset box-shadow in the section accent color. No drop shadows.
- **Hover (buttons & chips).** Invert fg/bg, 120ms ease-out.
- **Press state.** `translate(0, 1px)` + 0ms (instant). Mechanical click feel.
- **Page transitions.** None special — natural scroll. No parallax, no scroll-triggered reveals, no masks.
- **Pulsing live dot.** `@keyframes sp-pulse { 50% { opacity: .3; } }` + 1.4s ease-in-out infinite.
- **Filter chips (video grid).** Click toggles active. Currently UI-only in mock — wire to real data filter in production.
- **Discord panel pulse.** Green dot has same `sp-pulse` keyframe.
- **CTAs.** All "tap in", "pull up", "join the discord →" link to: real Discord invite / Bandcamp / Beatport / YouTube. None are wired up in the mock.

## State Management

This is content-driven, mostly server-rendered. Suggested state shape:

- **Releases** — list, filterable by site (artist `nick-hook` only on Site 1; whole roster on Site 3). Source: CMS or markdown.
- **Live dates** — sortable by date, ticket URL per row.
- **Videos** — pulled from YouTube Data API by channel ID `@thespacepit`. Cache server-side. Filter chips on Site 2 should be a real category facet (gear/live/radio/all).
- **Gear log** — markdown/CMS, infrequent edits, with status field.
- **Discord widget** — embed Discord widget script or use the Discord widget API for live counts; current static "2,127 in fam" / channel counts are placeholder.
- **Press quotes** — static markdown.
- **Artist roster** — CMS.

## Design Tokens

All in `colors_and_type.css`. Highlights:

**Colors**
- Ink: `#0B0B0B` (slightly warm — not pure black)
- Paper: `#F4EFE6` (warm cream)
- Paper-2: `#E8E2D4` (one step darker)
- Redline (Nick): `#E83A1C`
- Lamp (spacepit): `#F2B705`
- Collect (label): `#0E4B3A`
- Calllm (sub-label): `#C9B9E8`
- Chakras: root `#9B1B1B` · sacral `#E2651A` · solar `#F2C84B` · heart `#3E8E5A` · throat `#2F6FB3` · third eye `#4B2E83` · crown `#E3D4F2`

**Typography**
- Display: Antonio (Google) — heavy condensed grot, ALL CAPS, tight tracking. Substitute for the bespoke fontwork on Nick's covers.
- Body serif: Instrument Serif (Google), italic for asides.
- Body sans: Inter (Google), 14–16px.
- Mono: JetBrains Mono (Google), tabular numerals, .08–.14em letter-spacing.

**Spacing** — 8px baseline, all rhythm in multiples.

**Radii** — only `0` (sharp) or `999px` (pill). No 8/12/16px "tech" radii.

**Shadows** — only hard offset (`Npx Npx 0 <color>`). No soft drop shadows.

**Borders** — `1px solid var(--ink)` (or paper on dark surfaces). Strong, present.

## Assets

- `assets/logos/calmcollect-mark.gif` — animated heptagon (user-supplied). Use this as the moving mark.
- `assets/logos/calmcollect-mark.png` — static frame. Use for favicon, OG images.
- `assets/epk-text.md` — copy reference (credits, quotes, live show description).
- **Missing — please request from the client:**
  - Real record cover art (currently colored placeholders with rotated text).
  - Real fontwork from the record covers (the bespoke display typeface).
  - Studio photography from thespacepit (Brooklyn + Medellín).
  - Logos/wordmarks for "thespacepit" and "Calm + Collect" if separate from the heptagon.
  - YouTube channel ID + Discord invite + Bandcamp embed handles.
  - Real tour dates, real catalog data.

## Voice & Copy Rules (CRITICAL)

Read the brand bible — `01_brand_system_README.md` "Content Fundamentals" section. Cliff notes:

- **Lowercase by default.** All UI copy, body, CTAs, labels.
- **ALL CAPS** for display headlines and tracklists only.
- **First person plural** ("we out here") on thespacepit. **First person singular** ("nick / i") on artist site. **Collective** on Calm + Collect.
- **Never use:** "Discover", "Elevate", "Unlock", "Sonic journey", "Curated".
- **Use:** "pull up", "tap in", "we out here", "see u in the pit", "stay high".
- **Emoji** are allowed and encouraged (1–2 per sentence). House set: 🌱 🪐 💚 🔊 💿 🔥 ✨ 📼 🌈 ☁️ 🤲.

If your CMS or copy decks add Title Case or polite "Discover our latest releases" copy back in, **revert it** — that's the failure mode for this brand.

---

_If you're stuck or something feels off, fall back to the brand bible. The system is designed so any reasonable interpretation of "lamp amber on cream paper, heavy condensed caps, hard offset shadows, lowercase voice" should land in-pocket._
