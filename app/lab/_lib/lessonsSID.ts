// SID lesson: the Hubbard chord trick.

import type { Lesson } from "./lesson-types";
import type { SidParams } from "./engineSID";

export type LessonSidState = {
  params: SidParams;
  lastNoteMidi: number | null;
  lastNotePlayedAt: number;
};

export const HUBBARD_CHORD_LESSON: Lesson<LessonSidState> = {
  id: "hubbard-chord-trick",
  title: "The Hubbard chord trick",
  origin: "Rob Hubbard, Commodore 64, 1985",
  intro:
    "the SID had three voices. that should mean three-note polyphony max. hubbard figured out: cycle ONE voice through three pitches faster than the ear can resolve — and your brain hears a chord. that's the secret of c64 music. we'll set it up in 4 steps.",
  reward:
    "you just built an arpeggiator running at chip rate. drop ARP RATE back to 0 and the chord falls apart into one note again. this is how c64 composers like hubbard and galway sounded huge with three voices.",
  steps: [
    {
      id: "voice2-third",
      title: "Voice 2 ARP offset → +4 (major third)",
      body:
        "drag voice 2's pulsing ARP knob to +4 semitones. that's the major third above root. when the arp cycles, voice 2's interval will sound on the second step.",
      hint: "Voice 2 panel, ARP knob (third row of knobs).",
      target: "sid:voice:1:arp",
      check: (s) => s.params.voices[1].arpOffset >= 3 && s.params.voices[1].arpOffset <= 5,
    },
    {
      id: "voice3-fifth",
      title: "Voice 3 ARP offset → +7 (perfect fifth)",
      body:
        "now voice 3's ARP knob (pulsing) to +7 semitones — a perfect fifth above root. together with voice 2 you've just constructed a major triad in interval form.",
      hint: "Voice 3 panel, ARP knob.",
      target: "sid:voice:2:arp",
      check: (s) => s.params.voices[2].arpOffset >= 6 && s.params.voices[2].arpOffset <= 8,
    },
    {
      id: "arp-rate-up",
      title: "Crank ARP RATE",
      body:
        "push the pulsing ARP RATE up to ~30Hz. that's fast enough that your ear stops hearing individual notes and starts hearing a chord. below ~10Hz you hear an arpeggio; above 20Hz you hear harmony.",
      hint: "the ARP RATE knob is in the top-right of the room.",
      target: "sid:knob:arpRate",
      check: (s) => s.params.arpRate >= 0.5,
    },
    {
      id: "play-chord",
      title: "Hold a note, hear the chord",
      body:
        "hit any key and HOLD. you should hear what sounds like a 3-note chord — but it's actually voice 1 cycling 0 → +4 → +7 → 0 → ... at 30 cycles per second. drop ARP RATE to 0 to hear it fall apart.",
      hint: "any key, or press 'a' on your computer keyboard.",
      check: (s) => s.lastNoteMidi !== null && performance.now() - s.lastNotePlayedAt < 5000,
    },
  ],
};

export const LESSONS_SID: Lesson<LessonSidState>[] = [HUBBARD_CHORD_LESSON];
