---
name: nickhook-design
description: Use this skill to generate well-branded interfaces and assets for Nick Hook's three surfaces — the artist/producer site, thespacepit (studio + YouTube + Discord), and Calm + Collect (record label + calllm sub-label). Use it for production pages or throwaway prototypes, mocks, slides, and social assets. Contains essential design guidelines, colors, type, fonts, logo assets, and UI kit components.
user-invocable: true
---

Read the `README.md` at the root of this skill first — it contains the brand context, content fundamentals (how Nick writes), visual foundations (lamp-amber on cream paper, heavy condensed Antonio caps, italic serif asides, NYC flyer rhythm), iconography rules, and an index of every other file.

Then explore:
- `colors_and_type.css` — all design tokens (colors, type scales, semantic vars). Link this from every HTML artifact.
- `fonts/` — webfonts (Antonio, Instrument Serif, JetBrains Mono). **Flag to the user:** these are Google-Font substitutes for the real hand-drawn fontwork on Nick's record covers; ask if he can upload the real typefaces.
- `assets/logos/` — the rotating heptagon mark (`calmcollect-mark.png`) and wordmarks. Use the mark spinning on 8s for any live/active state.
- `ui_kits/nickhook/`, `ui_kits/spacepit/`, `ui_kits/calmcollect/` — working high-fidelity recreations of each surface. Copy components (Hero, VideoGrid, CatalogGrid, etc.) for mockups; don't reinvent.
- `preview/` — small specimen cards for the Design System tab (not usually needed when building).

**Voice.** Lowercase by default. First person plural ("we out here"). Imperative, invitational ("pull up", "come thru", "grab some samples"). Emoji as punctuation — 🌱 🪐 💚 sparingly. No corporate hype. No em-dashes stacked. Short lines, flyer rhythm.

**When building visual artifacts** (slides, mocks, throwaway prototypes): copy the assets out of this skill, link `colors_and_type.css`, and produce static HTML. Reuse the kit components.

**When working on production code**: read the CSS tokens, copy logos, and follow the visual foundations section of the README.

**If the user invokes this skill with no other guidance**: ask what they want — a social post, a release page, a slide for a show, merch mockup, etc. Ask which of the three surfaces (artist / spacepit / calm+collect) it's for, whether they want one option or a few variations, and what copy/tracks/images to feature. Then act as an expert designer and output HTML artifacts or production code, depending on the need.
