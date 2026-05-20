# HopChords for Ableton Live

A Max for Live MIDI Effect device that drops the 13-city chord generator
into Ableton Live. Same engine as `practice/hop_chords.html`, wired to
Live's tempo + MIDI routing.

## Files in this bundle

| File | What it is | Status |
|---|---|---|
| `HopChords.maxpat` | The Max patch (drag-and-drop onto a MIDI track) | **PENDING** — Nick still has to upload from the build chat |
| `hop_chords_m4l.html` | jweb UI embedded inside the patch — generator + auto-play + freestyle | ✓ Here |
| `HopChords_M4L_README.md` | Full setup steps | **PENDING** |

## Quick setup (once .maxpat arrives)

1. Open Ableton Live (any version with Max for Live).
2. Drag `HopChords.maxpat` onto a MIDI track.
3. Route the track's output to your synth (Ableton's IAC bus, a hardware
   sampler, anything that takes MIDI).
4. Press the GENERATE button on the UI. Live's tempo drives the chord
   cycle; chords go out as MIDI notes.

The jweb UI (`hop_chords_m4l.html`) is what shows up on the device face
inside Live. It expects the patch's outlets to be wired to it — without
the patch, you can still open the HTML in a browser to preview the UI.

## Tempo + MIDI

- BPM in the UI is **overridden by Live's transport** in M4L mode.
- MIDI sends on whatever channel the patch's outlet is configured for
  (defaults to ch 1).
- Use the same generate / play / chord-pool logic as the web version.

---

*Built alongside [thespacepit.com/practice/](https://thespacepit.com/practice/) —
the web version is free, the M4L bundle is for studio use.*
