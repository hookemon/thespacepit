# PRACTICE — TheSpacePit web app

A 13-city music practice playground. Static HTML, zero build step, localStorage for persistence. Lives at thespacepit.com/practice/.

This file is project memory for Claude Code. Read it before making changes.

---

## What this is

An interactive music practice environment built around 13 cities, each with its own mode/scale/synth/palette. Player creates a character, picks a starting city, hops around the Atlas, and uses each city to practice rhythm (finger drums), harmony (hop chords), melody (hop pyramid), and presence (be here now). The Garden tracks plants tied to each city.

It's the playable companion to a larger game concept. For now: it's a practice tool. Music skill compounds. Character persists.

The user is **Nick Hook** — Brooklyn-based producer / engineer / label owner. He uses this for himself (practice, songwriting via hop_chords MIDI out) and wants to share it with collaborators and friends.

---

## File map

| File | Role |
| --- | --- |
| `index.html` | **Entry point.** App shell with 5 nav tabs: ATLAS / STUDIO / PRACTICE / PRESENCE / YOU. |
| `character.html` | Character creator — name, pronouns, skin, hair, outfit, language, starting city, why. SVG avatar. |
| `hop_pyramid.html` | Q*bert-style melodic game. 6 city worlds. Pentatonic / modal scales per city. |
| `hop_chords.html` | Random beautiful chord progression generator. 13 city worlds. WebMIDI out. |
| `garden.html` | 12-plant gardening subworld. Plants tied to cities. Real-time growth. |
| `finger_drum_practice.html` | Five city drum patterns. WebMIDI in (controllers map to pads). |
| `studio.html` | Dub mixer — 6 synced clips, shared key, bar-quantized launches. |
| `be_here_now.html` | Presence zone — coherent breath orb, drone engine. No score, no progression. |

`DEPLOY.md` documents deploy targets and URL patterns.

---

## Architecture

### Static everything
No backend. No database. No build step. Just HTML files that link to each other with relative paths. Google Fonts from CDN is the only external dependency.

### Storage shim
Every HTML file has this near the top of its `<script>` block:

```js
if (!window.storage) {
  window.storage = {
    async get(key) { /* localStorage wrapper */ },
    async set(key, value) { /* localStorage wrapper */ },
    async delete(key) { /* localStorage wrapper */ },
    async list(prefix) { /* localStorage wrapper */ }
  };
}
```

This makes the code work both inside Claude (where `window.storage` is provided) and in any regular browser (falls back to localStorage). **Do not remove this shim.** When adding new files, copy it in.

### Shared state keys

| Key | Owner | Contents |
| --- | --- | --- |
| `character` | character.html | name, pronouns, skin, hair, outfit, language, city, why |
| `drum_state` | finger_drum_practice + others | { musicSkill, earSkill, hopBestLevel, hopWorld, gardenSkill, chordSkill, bpm, currentPatternIdx } |
| `garden_state` | garden.html | slots, grown plants, garden skill (mirrored to drum_state) |
| `hop_chords_v4` | hop_chords.html | { worldIdx, spread, velocity, tempo, barsLen, looping, midiOutputId, midiChannel } |

**When updating drum_state from a new module**, always merge with existing fields. Don't clobber other modules' skills:

```js
const r = await window.storage.get('drum_state');
const existing = (r && r.value) ? JSON.parse(r.value) : {};
existing.myNewField = newValue;
await window.storage.set('drum_state', JSON.stringify(existing));
```

### Cross-file URL params

- `hop_chords.html?world=madrid` — opens to Madrid chord world
- `hop_pyramid.html?world=brooklyn` — opens to Brooklyn pyramid
- `finger_drum_practice.html?city=medellin` — opens to cumbia pattern
- `garden.html?city=tulum` — opens to Tulum-themed garden

The Atlas in index.html deep-links every city's panel actions to the right URLs automatically.

### Character starting-city default
When `hop_chords.html` is opened with no URL param, it falls back to the character's `city` field from storage. Character → app → chords lands them in their home city's palette.

---

## The 13 cities

| # | ID | Name | Mode | Synth | Root |
| --- | --- | --- | --- | --- | --- |
| 1 | brooklyn | Brooklyn | Dorian | Lo-fi Rhodes | A |
| 2 | stlouis | St. Louis | Blues Mixolydian | Wurli | G |
| 3 | mexico | Mexico City | Major Pentatonic | Papel marimba | D |
| 4 | oaxaca | Oaxaca | Aeolian | Warm pad | A |
| 5 | tulum | Tulum | Lydian | Bell Rhodes | F |
| 6 | medellin | Medellín | Mixolydian | Marimba | D |
| 7 | paris | Paris | Lydian | Rhodes | C |
| 8 | madrid | Madrid | Phrygian Dominant | Flamenco pluck | D |
| 9 | berlin | Berlin | Aeolian | Saw pad | E |
| 10 | rishikesh | Rishikesh | Raga Yaman | Harmonium | D |
| 11 | varanasi | Varanasi | Raga Bhairavi | Tanpura | C |
| 12 | mysore | Mysore | Raga Mohanam | Veena koto | C |
| 13 | tokyo | Tokyo | Insen / Quartal | Koto | D |

Cities are first-class identity. Stay consistent across hop_chords, hop_pyramid, finger_drum, garden, etc.

---

## Visual design system

Locked **Cubist Yellow** direction. **Don't drift from this without explicit permission.**

### Colors (CSS custom properties)

```css
--paper: #f3ecd8;      /* cream paper background */
--paper-2: #ebe2c8;
--paper-3: #e3d9bb;
--ink: #15110d;        /* deep brown-black */
--ink-2: #3a322a;
--ink-3: #6a5e4a;
--yellow: #ffd400;     /* sunshine yellow — TheSpacePit primary */
--terracotta: #c8743e;
--teal: #2a5556;
--red: #c44438;
--green: #5a8a47;
--plum: #5c2858;
--rose: #d96b7d;
--gold: #d4a32d;
```

Each city also has its own palette (cubeTop, cubeLeft, cubeRight, accent, ink, playerBody, playerSnout, playerEye) used by HOP modules.

### Typography
- **Headlines:** Bricolage Grotesque weight 800–900
- **Italic accents in terracotta:** Fraunces italic 500 (`em` tags styled with `font-family: 'Fraunces', serif; font-style: italic; color: var(--terracotta);`)
- **Labels / monospace:** DM Mono 300–500, all caps, letter-spacing 1.2–1.5px

Cards tilt slightly (-0.5° / +0.4°) with offset drop shadows (`box-shadow: 4px 4px 0 var(--ink)`). The hard-shadow-no-blur aesthetic.

SVG noise overlay at 0.18 opacity multiply blend on body. Gives the paper texture.

### Voice
- Lowercase titles with italic period stops — hop. garden. studio.
- Subtitles all-caps with letter-spacing and — em-dashes
- Inline italic for sensory / poetic phrases — *"the long siesta and longer dinner"*
- DJ quotes per city — single line, lowercase, ends with period

---

## Deploy

The web bundle (everything except CLAUDE.md and DEPLOY.md, but they don't hurt) goes to a folder on thespacepit.com — `public/practice/` in this Next.js repo, served at `thespacepit.com/practice/`. Static, no server config needed.

To test locally:
```sh
cd public/practice/
python3 -m http.server 8000
# open http://localhost:8000/
```

The relative file links work because all 8 HTML files sit in the same flat directory.

---

## What's done

- ✓ Atlas with all 13 cities, numbered, hover-dance animation, bottom-sheet city panel
- ✓ Character creator with live SVG avatar
- ✓ HOP CHORDS — all 13 cities, generator + auto-play + WebMIDI out
- ✓ HOP PYRAMID — 6 cities (madrid / paris / medellin / brooklyn / berlin / tokyo)
- ✓ Finger drum — 5 city patterns, basic MIDI in (8 notes mapped to 4 pads)
- ✓ Garden — 12 plants, real-time growth, persistent state
- ✓ Studio — dub mixer, 6 synced clips
- ✓ Be Here Now — drone + breath
- ✓ YOU dashboard — character, music skill, ear skill, hop best, garden, chords played
- ✓ Storage shim across all 8 files
- ✓ Cross-file deep-links via URL params
- ✓ M4L bundle (separate — HopChords.maxpat + hop_chords_m4l.html)

## What's pending

1. **HOP pyramid for the 7 new cities** — stlouis / mexico / oaxaca / tulum / rishikesh / varanasi / mysore need their own melodic worlds. Mirror the chord version's structure.
2. **Tambora/Latin drum pad** — reskin finger_drum_practice for Medellín / Mexico City / Oaxaca / Tulum with palm/conga/güira/timbal voices.
3. **Music theory flashcard module** — Nick specifically asked for this. Famous progressions (I-V-vi-IV, ii-V-I, i-VI-III-VII, Andalusian, Coltrane changes, etc.) with key picker, voicing picker, MIDI out, "why this works" notes. Pattern off hop_chords.html's structure.
4. **MIDI input expansion for finger_drum** — accept K.O.II / Move / any controller's full pad range. Consider a MIDI Learn mode.
5. **Spacepit Radio** — `spacepit_radio.html` in progress (not in deploy bundle).
6. **Working title decision** — Practice / Any City / The Quiet Game.

---

## Working with Nick

He moves fast. Pivots often. Prefers:
- Short, direct responses — no overexplaining
- Build first, refine on feedback
- Honest pushback when something won't work
- Lowercase, voice-to-text style — match that energy
- All-caps from him = flow state, keep building

When he says "keep wiring" or "keep going" — drive forward without asking clarifying questions. Capture decisions in this file or TODO comments rather than asking.

When in doubt about visual direction, **err toward the Cubist Yellow system above.** Don't introduce new colors, fonts, or card styles without checking.
