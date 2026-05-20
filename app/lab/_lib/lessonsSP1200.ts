// SP-1200 lesson: the Pete Rock pitch-up trick.

import type { Lesson } from "./lesson-types";
import type { PadParams, PadId } from "./engineSP1200";

export type LessonSP1200State = {
  pads: Record<PadId, PadParams>;
  activePad: PadId;
  lastTriggerAt: number;
};

export const PITCH_UP_LESSON: Lesson<LessonSP1200State> = {
  id: "pete-rock-pitch-up",
  title: "The pitch-up trick",
  origin: "Pete Rock & every SP-1200 producer, 1991-on",
  intro:
    "the SP-1200 had 10 seconds of memory total. that's not a lot. so producers tuned their samples UP to fit more in: a 2-second snare at +12 semitones becomes a 1-second snare with brighter, dustier character. that pitched-up grain became the sound of an entire decade. 3 steps to feel it.",
  reward:
    "that's the move. pitched-up = brighter + shorter + dirtier. now try pitching a kick up +12 — you've made a hi-hat. pitch a vocal up +18 — you've made a chipmunk pad. once you hear it, you hear it on every record.",
  steps: [
    {
      id: "select-pad-1",
      title: "Tap pad P1 (kick) — hear it normal",
      body:
        "click the pulsing pad — the 909 kick already loaded on slot 1. listen to its weight, its low end, its decay.",
      hint: "first pad on the left, big button labeled P1.",
      target: "sp1200:pad:P1",
      check: (s) => s.activePad === "P1" && performance.now() - s.lastTriggerAt < 5000,
    },
    {
      id: "pitch-up",
      title: "Crank PITCH on P1 to +12 semitones",
      body:
        "with P1 selected, drag the pulsing PITCH knob up to +12. an octave up. the engine plays the sample twice as fast, which makes it shorter and brighter. that's the SP trick — same waveform, completely different feel.",
      hint: "PITCH lives in the EDIT panel on the right.",
      target: "sp1200:knob:pitch",
      check: (s) => s.pads.P1.pitch >= 11,
    },
    {
      id: "trigger-pitched",
      title: "Tap P1 again — now it's a hi-hat",
      body:
        "click P1 once more. same sample, but at +12 it's no longer a kick — it's a tight, dusty stab. pete rock would tune kicks up to make hats. RZA would tune vocals up to make horns. constraint becomes character.",
      hint: "click P1.",
      check: (s) => s.activePad === "P1" && s.pads.P1.pitch >= 11 && performance.now() - s.lastTriggerAt < 5000,
    },
  ],
};

export const LESSONS_SP1200: Lesson<LessonSP1200State>[] = [PITCH_UP_LESSON];
