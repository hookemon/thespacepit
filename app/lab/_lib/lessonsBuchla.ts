// Buchla lesson: let the Source of Uncertainty play it.

import type { Lesson } from "./lesson-types";
import type { BuchlaParams, PlateShape } from "./engineBuchla";

export type LessonBuchlaState = {
  params: BuchlaParams;
  lastPlate: PlateShape | null;
  lastPlateAt: number;
};

export const SOU_PLAYS_IT_LESSON: Lesson<LessonBuchlaState> = {
  id: "sou-plays-it",
  title: "Let the SoU play it",
  origin: "Morton Subotnick · Silver Apples of the Moon, 1967",
  intro:
    "this room has no keyboard. west coast philosophy: the synth is a system, not an instrument. subotnick patched a buchla to play itself — the source of uncertainty (slow random voltage) modulates the timbre while you hold a drone. you don't perform, you set up the system and step back. 3 steps to feel it.",
  reward:
    "that's the compositional ethos. you didn't play a melody — you patched a system that played itself. crank RANDOM down to 0 to make it static again. drop CUTOFF lower to bring back the bonk character. each knob is a parameter of the system, not a note.",
  steps: [
    {
      id: "hit-drone",
      title: "Tap the DRONE plate",
      body:
        "click the pulsing DRONE plate. unlike the bonk/pluck/swell plates, this one sustains until you release it. now the patch is holding a continuous tone.",
      hint: "the rightmost touch plate, labeled DRONE.",
      target: "buchla:plate:drone",
      check: (s) => s.lastPlate === "drone" && performance.now() - s.lastPlateAt < 8000,
    },
    {
      id: "crank-random",
      title: "Push RANDOM up",
      body:
        "drag the pulsing RANDOM knob up to 80%. now the SoU is modulating the complex oscillator's timbre. you should hear the drone slowly evolving — never quite the same from second to second. that's the system playing itself.",
      hint: "RANDOM lives in the SOURCE OF UNCERTAINTY panel, rightmost.",
      target: "buchla:knob:random",
      check: (s) => s.params.randomAmt >= 0.7,
    },
    {
      id: "listen",
      title: "Listen for 10 seconds. Touch nothing.",
      body:
        "this is the lesson. you set up a system. it plays itself. the timbre wanders. you can tweak SHAPE or CUTOFF to nudge it, but you don't have to. subotnick spent whole album sides doing nothing more than this.",
      hint: "just listen.",
      check: (s) => s.params.randomAmt >= 0.7 && performance.now() - s.lastPlateAt > 9000,
    },
  ],
};

export const LESSONS_BUCHLA: Lesson<LessonBuchlaState>[] = [SOU_PLAYS_IT_LESSON];
