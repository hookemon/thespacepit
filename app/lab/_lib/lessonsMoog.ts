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
        "click the pulsing 'square' button under OSCILLATOR. a square wave has more low-mid energy than a saw — punchier, more voiced. bernie's bass is built on this.",
      hint: "the wave buttons are above the DETUNE/SUB knobs.",
      target: "moog:wave:square",
      check: (s) => s.params.waveform === "square",
    },
    {
      id: "add-sub",
      title: "Add the sub octave",
      body:
        "drag the pulsing SUB knob up to around 70. adds a square wave one octave below the main oscillator. what gives the bass its weight without making it muddy.",
      hint: "drag the SUB knob up. you want it around 60–80%.",
      target: "moog:knob:SUB",
      check: (s) => s.params.subLevel >= 0.55,
    },
    {
      id: "low-cutoff",
      title: "Close the filter way down",
      body:
        "drop the pulsing CUTOFF knob to about 25–30%. a closed filter mutes the highs. patch should get muffled, almost too dark — that's intentional. the envelope is about to open it.",
      hint: "CUTOFF lives in the FILTER panel. low values = closed.",
      target: "moog:knob:CUTOFF",
      check: (s) => s.params.cutoff <= 0.35,
    },
    {
      id: "envelope-amount",
      title: "Now make the filter snap open with the envelope",
      body:
        "crank ENV AMT (pulsing) up to ~70–80%. that tells the filter envelope to PUSH the cutoff up when you play a note. then set FILTER ENV's A to 0 + D to ~18% for the snap.",
      hint: "ENV AMT is the third knob in the filter panel. FILTER ENV is on the right side.",
      target: "moog:knob:ENVAMT",
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
        "hit any key on the on-screen keyboard or press a/s/d/f. cutoff should snap open and shut on every note — that's the bernie sound. for the actual riff, try z to go down two octaves, then play C → C → D# → C → F.",
      hint: "click any white key on the keyboard, or press the 'a' key on your computer keyboard.",
      // any note played within the last 5 seconds counts as "played a note"
      check: (s) => s.lastNoteMidi !== null && performance.now() - s.lastNotePlayedAt < 5000,
    },
  ],
};

export const CABARET_DRONE_LESSON: Lesson<LessonMoogState> = {
  id: "cabaret-drone-dial",
  title: "Dial in the Cabaret drone",
  origin: "Cabaret Voltaire · Red Mecca, 1981",
  intro:
    "same moog circuit as flash light. completely different intent. sheffield 1981: saw + sub through a closed filter, slow attack, long release, high resonance. hold one note and let the filter envelope do all the work. load 'init' from the patch menu, then hit start.",
  reward:
    "that's sheffield. the moog wasn't built for industrial music — but the same architecture that gave bernie his bounce gives cabaret voltaire their dread. hold a single low note for 10 seconds and let the room evolve.",
  steps: [
    {
      id: "saw-wave",
      title: "Stay on the saw wave",
      body:
        "sawtooth — most harmonics, brightest before filtering. flash light used square; cabaret uses saw. confirm/click the pulsing 'sawtooth' button.",
      hint: "the wave button row, leftmost option.",
      target: "moog:wave:sawtooth",
      check: (s) => s.params.waveform === "sawtooth",
    },
    {
      id: "add-sub-cab",
      title: "Layer in the sub octave",
      body:
        "turn the pulsing SUB knob to ~50. drone weight without mud. same sub as flash light, slightly lower mix level.",
      hint: "SUB knob, around 40–60%.",
      target: "moog:knob:SUB",
      check: (s) => s.params.subLevel >= 0.35 && s.params.subLevel <= 0.7,
    },
    {
      id: "low-cutoff-high-reso",
      title: "Close the filter + crank resonance",
      body:
        "drop the pulsing CUTOFF to ~22%, then push RESO up to ~70. high resonance + low cutoff = the filter starts ringing on its own. that moan IS the cabaret sound.",
      hint: "CUTOFF low, RESO high. the filter should be singing before you even hit a note.",
      target: "moog:knob:CUTOFF",
      check: (s) => s.params.cutoff <= 0.3 && s.params.resonance >= 0.55,
    },
    {
      id: "slow-attack",
      title: "Slow the attack — both envelopes",
      body:
        "drag the pulsing AMP ENV 'A' (attack) knob up to ~45%, then do the same for FILTER ENV's A at ~60%. nothing pops in suddenly anymore — every note swells in over almost a second. that's the sheffield drone shape.",
      hint: "the A knob on AMP ENV (right panel, bottom row) and FILTER ENV (right panel, top row).",
      target: "moog:knob:AMPA",
      check: (s) => s.params.aAttack >= 0.35 && s.params.fAttack >= 0.5,
    },
    {
      id: "long-release",
      title: "Long releases so notes rot out instead of cutting",
      body:
        "drag the pulsing AMP ENV 'R' (release) up to ~80%, FILTER ENV's R to ~70%. when you let a key go, the sound takes its time to die. now hold a low note and listen for 5 seconds — the filter envelope is still moving long after you let go.",
      hint: "the R knob on both envelope rows. crank both.",
      target: "moog:knob:AMPR",
      check: (s) => s.params.aRelease >= 0.65 && s.params.fRelease >= 0.55,
    },
  ],
};

export const LESSONS_MOOG: Lesson<LessonMoogState>[] = [FLASH_LIGHT_LESSON, CABARET_DRONE_LESSON];
