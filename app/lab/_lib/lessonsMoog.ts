// Guided lessons for the Moog room. Each one walks the user through dialing
// in a specific patch and then playing the actual riff.

import type { Lesson } from "./lesson-types";
import type { MoogParams } from "./engineMoog";

export type LessonMoogState = {
  params: MoogParams;
  lastNotePlayedAt: number; // performance.now() of most recent note-on
  lastNoteMidi: number | null;
  octaveBase: number;
};

const within = (v: number, target: number, tol = 0.1) =>
  Math.abs(v - target) <= tol;

export const FLASH_LIGHT_LESSON: Lesson<LessonMoogState> = {
  id: "flash-light-dial",
  title: "Dial in Flash Light",
  origin: "Bernie Worrell · Parliament, 1977",
  intro:
    "in '77 bernie sat down at a minimoog and built the bassline that retired every other bass player on the radio. we're going to dial in his patch one knob at a time — and at the end you play the riff. start the patch from scratch (load 'init' from the patch menu when you're ready), then hit start.",
  reward:
    "that's flash light. the secret was never one knob — it's the relationship between the square wave, the sub octave, and that fast filter envelope. now try playing the riff (C2 → C2 → D#2 → C2 → F2, in that order, with a swing).",
  steps: [
    {
      id: "pick-square",
      title: "Switch the oscillator to square wave",
      body:
        "click 'square' under OSCILLATOR. a square wave has more low-mid energy than a saw — it's punchier, more 'voiced'. bernie's bass is built on this.",
      hint: "the wave buttons are above the DETUNE/SUB knobs.",
      check: (s) => s.params.waveform === "square",
    },
    {
      id: "add-sub",
      title: "Add the sub octave",
      body:
        "turn SUB up to around 70. that adds a square wave one octave below the main oscillator. it's what gives the bass its weight without making it muddy.",
      hint: "drag the SUB knob up. you want it around 60–80%.",
      check: (s) => s.params.subLevel >= 0.55,
    },
    {
      id: "low-cutoff",
      title: "Close the filter way down",
      body:
        "drop CUTOFF to about 25–30%. a closed filter mutes the highs. you should hear the patch get muffled, almost too dark. that's intentional — the envelope is about to open it.",
      hint: "CUTOFF lives in the FILTER panel. low values = closed.",
      check: (s) => s.params.cutoff <= 0.35,
    },
    {
      id: "envelope-amount",
      title: "Now make the filter snap open with the envelope",
      body:
        "turn ENV AMT up to around 70–80%. that tells the filter envelope to PUSH the cutoff up when you play a note. then set FILTER ENV's A to 0, D to about 18%. that's the snap.",
      hint: "ENV AMT is the third knob in the filter panel. FILTER ENV is on the right side.",
      check: (s) =>
        s.params.envAmount >= 0.6 &&
        s.params.fAttack <= 0.1 &&
        s.params.fDecay <= 0.3 &&
        s.params.fDecay >= 0.1,
    },
    {
      id: "play-the-riff",
      title: "Play a note and listen",
      body:
        "hit any key on the on-screen keyboard or press a/s/d/f. you should hear the cutoff snap open and close on every note — that's the bernie sound. for the actual riff, try the C2 octave (z to go down two octaves from default), then play C → C → D# → C → F.",
      hint: "click any white key on the keyboard, or press the 'a' key on your computer keyboard.",
      // any note played within the last 5 seconds counts as "played a note"
      check: (s) => s.lastNoteMidi !== null && performance.now() - s.lastNotePlayedAt < 5000,
    },
  ],
};

export const LESSONS_MOOG: Lesson<LessonMoogState>[] = [FLASH_LIGHT_LESSON];
