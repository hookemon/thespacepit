// Modular lesson: wire FM in 60 seconds.

import type { Lesson } from "./lesson-types";
import type { ModularParams } from "./engineModular";

export type LessonModularState = {
  params: ModularParams;
  lastNoteMidi: number | null;
  lastNotePlayedAt: number;
};

export const WIRE_FM_LESSON: Lesson<LessonModularState> = {
  id: "wire-fm-in-60s",
  title: "Wire FM in 60 seconds",
  origin: "DX7 architecture, in 6 modules",
  intro:
    "the DX7 next door has 6 operators wired into 32 algorithms. you don't need that many to do FM — you need two oscillators where one modulates the other. switch this room to the FM LEAD patch and you've already done it. 4 quick steps to feel why FM is its own thing.",
  reward:
    "that's all FM is. one oscillator modulating another's frequency. push VCO2 RATIO to integer values (2, 3, 4) for harmonic bell tones; non-integer values (2.5, 3.5) for inharmonic metallic ones. it's the same math chowning licensed to yamaha in 1973.",
  steps: [
    {
      id: "switch-fm-lead",
      title: "Switch to FM LEAD patch",
      body:
        "click the pulsing 'FM LEAD' button. this re-wires VCO2's output into VCO1's frequency input — instead of summing both oscillators, VCO2 now modulates VCO1.",
      hint: "PATCH selector, top transport row.",
      target: "modular:patch:fm-lead",
      check: (s) => s.params.program === "fm-lead",
    },
    {
      id: "vco2-level-up",
      title: "Crank VCO2 LEVEL — the FM index",
      body:
        "VCO2's level in FM LEAD mode controls how much it modulates VCO1. higher level = more sidebands = brighter/more metallic. drag the pulsing LEVEL up to ~50.",
      hint: "VCO2 panel, LEVEL knob.",
      target: "modular:knob:vco2level",
      check: (s) => s.params.vco2Level >= 0.4,
    },
    {
      id: "vco2-ratio",
      title: "Set VCO2 RATIO to 3.5",
      body:
        "the relationship between VCO2's frequency and VCO1's is what determines the timbre. integer ratios = harmonic. 3.5 = inharmonic — bells, metals. drag the pulsing RATIO knob.",
      hint: "VCO2 panel, RATIO knob.",
      target: "modular:knob:vco2ratio",
      check: (s) => s.params.vco2Ratio >= 3.0 && s.params.vco2Ratio <= 4.0,
    },
    {
      id: "play-fm",
      title: "Play a note + hear FM",
      body:
        "hit any key. you should hear something halfway between a bell and a brass — same VCO1 oscillator, but modulated by VCO2. switch back to BASIC patch and the same note becomes warm/flat. the patch is what's different.",
      hint: "any white key, or press 'a' on your computer keyboard.",
      check: (s) => s.lastNoteMidi !== null && performance.now() - s.lastNotePlayedAt < 5000,
    },
  ],
};

export const LESSONS_MODULAR: Lesson<LessonModularState>[] = [WIRE_FM_LESSON];
