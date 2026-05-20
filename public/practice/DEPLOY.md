# DEPLOY TO THESPACEPIT.COM

Two bundles to ship. The **web bundle** goes on thespacepit.com. The **M4L bundle** is a separate download for anyone (you) who wants to run HopChords inside Ableton Live.

---

## WEB BUNDLE — 8 files, zero dependencies

Everything's static HTML. No backend, no database, no API keys, no build step. Just Google Fonts from CDN. Drop the files in any directory, they wire to each other automatically.

| File | What it is | Approx size |
|------|------------|-------------|
| **`index.html`** | the entry point — Atlas with all 13 cities | 70K |
| `character.html` | character creator (avatar + game setup) | 49K |
| `hop_pyramid.html` | Q*bert melodic game (6 worlds — needs 7 more for full city coverage) | 65K |
| `hop_chords.html` | random beautiful chord progressions, 13 worlds, MIDI out | 75K |
| `garden.html` | 12-plant gardening subworld | 53K |
| `finger_drum_practice.html` | 5 city drum patterns + MIDI in | 55K |
| `studio.html` | dub mixer with 6 synced clips | 34K |
| `be_here_now.html` | presence zone (drone + breath) | 20K |

Total ~420K. Loads fast on phones.

---

## DEPLOY OPTIONS

Three reasonable places to put it. Pick one based on what fits.

### Option 1 — subdirectory (recommended for first launch)

Make a folder on the site and drop everything in:

```
thespacepit.com/practice/index.html
thespacepit.com/practice/hop_chords.html
thespacepit.com/practice/character.html
... etc (all 8 files)
```

Share **`thespacepit.com/practice/`** — that's the URL people open. Doesn't touch your existing studio site at the root.

Other good folder names if `/practice` doesn't fit: `/play`, `/world`, `/app`, `/atlas`.

### Option 2 — subdomain (cleanest URL)

Point a subdomain at a new directory:

```
practice.thespacepit.com → /var/www/practice/
```

Share **`practice.thespacepit.com`** — opens the Atlas. Most professional-feeling option for sharing.

Requires touching DNS records (add a CNAME or A record) plus the web server config (Apache/Nginx). If your host has a one-click subdomain panel (cPanel, Cloudflare Pages, Netlify), it's a 2-minute job.

### Option 3 — replace homepage

Drop the 8 files at the root, the Atlas becomes the front door. Only do this if you're rebranding TheSpacePit around this experience. Probably not what you want — keep your studio's existing site as-is and use Option 1 or 2.

---

## DEEP LINKS THAT WORK ON THE LIVE SITE

These URL patterns are already wired. Useful for sharing specific cities:

| URL | Lands you on |
|-----|--------------|
| `practice/` | Atlas (13 cities) |
| `practice/hop_chords.html?world=madrid` | Madrid flamenco chord generator |
| `practice/hop_chords.html?world=brooklyn` | Brooklyn Dorian boom-bap |
| `practice/hop_chords.html?world=tokyo` | Tokyo Insen koto |
| `practice/hop_pyramid.html?world=berlin` | Berlin melodic pyramid |
| `practice/finger_drum_practice.html?city=medellin` | cumbia pattern |
| `practice/garden.html?city=tulum` | jungle/cacao garden |
| `practice/character.html` | character creator |

Share any of these. They'll open straight to the right place.

---

## WHAT WORKS AFTER DEPLOY (that doesn't in this preview)

**Cross-file navigation** — every ENTER button, city link, PRACTICE card, YOU → MAKE YOURSELF flow. In the Claude preview each file is served from its own URL so relative links 404; on a real domain in the same folder, they all wire up.

**Persistent state across visits** — `localStorage` is hooked up via storage shim in every file. Character, garden, music skill, drum patterns, chord skill — all of it survives closing the browser, restarting the phone, coming back next week. Already wired ✓

**WebMIDI** — Chrome and Edge support it (Safari doesn't). On a real domain, both `hop_chords.html` and `finger_drum_practice.html` will see USB MIDI controllers and Live's IAC bus. Plug in a K.O.II, an MPC, an Ableton Push — it shows up in the device dropdown.

**Mobile** — the app shell, character creator, garden, and be_here_now all work great on phone. The pyramid games (HOP and HOP CHORDS) work but are tighter — they were designed for tablet+ first.

---

## ATLAS NUMBERS — what they mean

The 13 cities on the Atlas are numbered roughly by the journey order — Americas first (1–6), Europe (7–9), India (10–12), Japan (13). Not strict geographic order, just a path that flows visually from left to right:

1. **Brooklyn** (red) — home base, where TheSpacePit lives
2. **St. Louis** (rust) — where it begins
3. **Mexico City** (orange) — altitude and altars
4. **Oaxaca** (brown) — mezcal and mole
5. **Tulum** (green) — jungle cenote
6. **Medellín** (pink) — eternal spring
7. **Paris** (rose) — café and Gaudí refs
8. **Madrid** (gold/yellow) — Iberian gold, the hub
9. **Berlin** (gray) — concrete brutalism
10. **Rishikesh** (green) — Ganges, ashrams
11. **Varanasi** (terracotta) — oldest city
12. **Mysore** (gold) — sandalwood sunrise
13. **Tokyo** (red) — lantern Insen

Each number's font scales by digit count (single digits at 14px, double digits at 12px) so they all read clean on phone. Hover the number — it dances. Tap the city — bottom sheet slides up with 5 actions: CHORDS / DRUMS / GARDEN / STUDIO / BE HERE.

---

## QUICK DEPLOY CHECKLIST

- [ ] Download all 8 HTML files
- [ ] Pick a directory or subdomain on the server
- [ ] Upload via FTP / cPanel / `scp` / Cloudflare drag-drop / whatever you use
- [ ] Open the URL — should land on the Atlas
- [ ] Tap Madrid → ★ CHORDS → flamenco chord generator loads
- [ ] Tap PRACTICE tab → 4 cards (FINGER DRUM, HOP, HOP CHORDS, GARDEN)
- [ ] Tap YOU → MAKE YOURSELF → build character → BEGIN → returns to Atlas with avatar in header
- [ ] Refresh page — character persists. Skill counters persist.
- [ ] Share the URL. Done.

If anything 404s, it's because a filename got renamed during upload. Filenames are case-sensitive on most Linux web servers — keep them exactly as listed.

---

## M4L BUNDLE — separate download for studio gear

Three more files in a separate folder for anyone running HopChords inside Ableton Live:

```
HopChords/
  HopChords.maxpat              ← Max for Live patcher
  hop_chords_m4l.html           ← UI (jweb-embedded, MIDI out via Max outlets)
  HopChords_M4L_README.md       ← setup instructions
```

This bundle doesn't go on thespacepit.com — it's a standalone studio tool. Could host it as a downloadable .zip from a dedicated page like `thespacepit.com/m4l-tools/` or just share the zip via Dropbox / Google Drive to whoever wants it.

Setup is documented in the README — about 2 minutes from download to running inside Live as a MIDI Effect device.

---

## NEXT WHEN YOU'RE READY

The standalone files still have a few things from the to-do list before they feel fully finished:

1. **HOP pyramid worlds for the 7 new cities** — currently only 6 worlds in hop_pyramid.html (Madrid, Paris, Medellín, Brooklyn, Berlin, Tokyo). St. Louis, Mexico City, Oaxaca, Tulum, Rishikesh, Varanasi, Mysore need their own palettes + scales — chord version already has all 13 ✓
2. **Tambora/Latin drum reskin** for finger_drum (palm/conga/güira/timbal pads when in Medellín/Mexico/Tulum)
3. **Music theory module** — chord progression flashcards (famous progressions, "why this works" notes, key picker, MIDI out) — the thing you said you wanted next
4. **MIDI input expansion** for finger_drum — broader pad mapping for K.O.II / Move / any controller (currently only 8 specific note numbers map)
5. **Spacepit Radio** — `spacepit_radio.html` exists in progress
6. **Working title** — Practice / Any City / The Quiet Game

The architecture lets any of these drop in without rebuilding the rest.
