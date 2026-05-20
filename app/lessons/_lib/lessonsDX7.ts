// DX7 lesson: build the FM bell from an init patch.

import type { Lesson } from "./lesson-types";
import type { DX7Params } from "./engineDX7";

export type LessonDX7State = {
  params: DX7Params;
  lastNoteMidi: number | null;
  lastNotePlayedAt: number;
};

export const BUILD_BELL_LESSON: Lesson<LessonDX7State> = {
  id: "build-the-bell",
  title: "Build the FM bell",
  origin: "the patch every 80s ballad opens with",
  intro:
    "FM bells come from one trick: a carrier (OP1) playing the actual note, with a chain of modulators stacked above it at high ratios. each operator above adds metallic overtones. we'll dial it in op-by-op from an init patch. start when ready.",
  reward:
    "that's the bell. the magic was always the ratio — push OP2's ratio up, the bell gets brighter. drop OP4's level to 0, the bell becomes a flute. one patch shape, infinite voices. now play with it.",
  steps: [
    {
      id: "alg-cascade",
      title: "Confirm cascade algorithm",
      body:
        "the pulsing 'cascade' button under ALG. that's 4→3→2→1 — each operator modulates the next, classic bell topology. default is already cascade so this might already be lit.",
      hint: "ALG is in the top transport row.",
      target: "dx7:alg:cascade",
      check: (s) => s.params.algorithm === "cascade",
    },
    {
      id: "op1-long-decay",
      title: "OP1 (carrier): long decay, no sustain",
      body:
        "OP1 is the carrier — what you actually hear. set its DECAY high (~80%) and SUSTAIN to 0. bell character means strike + ring out + silence, no sustained body.",
      hint: "OP1 panel, third+fourth ADSR knob (D and S).",
      target: "dx7:op:0:decay",
      check: (s) => s.params.ops[0].decay >= 0.6 && s.params.ops[0].sustain <= 0.1,
    },
    {
      id: "op4-level-high",
      title: "OP4 (deepest modulator): crank LEVEL",
      body:
        "OP4 sits at the top of the cascade. its LEVEL controls how much it modulates OP3 — which ripples down to OP1. push OP4 LEVEL to ~50–70% to introduce real metallic overtones.",
      hint: "OP4 panel, LEVEL knob.",
      target: "dx7:op:3:level",
      check: (s) => s.params.ops[3].level >= 0.4,
    },
    {
      id: "op2-ratio-high",
      title: "OP2 RATIO up to a non-integer",
      body:
        "OP2 modulates OP1 directly. integer ratios = harmonic (musical) timbres. non-integer ratios = inharmonic, bell-like. try ratio ~3.5.",
      hint: "OP2 panel, RATIO knob.",
      target: "dx7:op:1:ratio",
      check: (s) => s.params.ops[1].ratio >= 2.5 && s.params.ops[1].ratio <= 5,
    },
    {
      id: "play-bell",
      title: "Play a note + hear the bell",
      body:
        "hit any key. you should hear the metallic strike, the harmonics rotting away through the decay, and silence. that's a DX7 bell built from scratch. now play around — push OP2 ratio higher for brighter, drop OP4 level for warmer.",
      hint: "any white key, or press 'a' on your computer keyboard.",
      check: (s) => s.lastNoteMidi !== null && performance.now() - s.lastNotePlayedAt < 5000,
    },
  ],
};

export const LESSONS_DX7: Lesson<LessonDX7State>[] = [BUILD_BELL_LESSON];
