// Canonical 909 patterns. These aren't the actual MIDI from the records
// (those vary and are copyrighted) — they're the rhythmic skeletons that
// define each style. Toggle them on, then change them. That's the lesson.

import type { Voice } from "./engine909";

export type Preset = {
  id: string;
  name: string;
  origin: string;
  bpm: number;
  swing: number;
  story: string;
  // 16-step grid per voice
  steps: Partial<Record<Voice, boolean[]>>;
};

const X = true;
const _ = false;

export const PRESETS: Preset[] = [
  {
    id: "chicago-4x4",
    name: "Chicago 4×4",
    origin: "Frankie at the Warehouse, 1985",
    bpm: 122,
    swing: 0,
    story:
      "the foundation. kick on every beat — that's the dance floor. offbeat open-hat is the engine. clap on 2 and 4 is the body. everything else is decoration.",
    steps: {
      BD: [X,_,_,_, X,_,_,_, X,_,_,_, X,_,_,_],
      OH: [_,_,X,_, _,_,X,_, _,_,X,_, _,_,X,_],
      CP: [_,_,_,_, X,_,_,_, _,_,_,_, X,_,_,_],
      CH: [X,X,_,X, X,X,_,X, X,X,_,X, X,X,_,X],
    },
  },
  {
    id: "detroit-strings",
    name: "Detroit drive",
    origin: "Derrick May / Mayday lineage",
    bpm: 128,
    swing: 0.04,
    story:
      "tighter, faster, more syncopated. detroit pushed the kick around — listen for the extra hit on the 'e of 4'. rim shot peppering the off-beats. cleaner sound, futurist intent.",
    steps: {
      BD: [X,_,_,_, X,_,_,X, X,_,_,_, X,_,X,_],
      CP: [_,_,_,_, X,_,_,_, _,_,_,_, X,_,_,_],
      CH: [X,X,X,X, X,X,X,X, X,X,X,X, X,X,X,X],
      OH: [_,_,X,_, _,_,X,_, _,_,X,_, _,_,X,_],
      RS: [_,_,_,X, _,_,_,_, _,X,_,_, _,_,_,_],
    },
  },
  {
    id: "acid-shuffle",
    name: "Acid shuffle",
    origin: "Phuture-adjacent, 1987",
    bpm: 124,
    swing: 0.18,
    story:
      "more swing in the hat. less downbeat emphasis. when the 303 went on top of this, chicago invented acid house in one studio session. the 909 here is just keeping time for something weirder.",
    steps: {
      BD: [X,_,_,_, X,_,_,_, X,_,_,_, X,_,_,_],
      CH: [_,X,_,X, _,X,_,X, _,X,_,X, _,X,_,X],
      OH: [_,_,_,_, _,_,X,_, _,_,_,_, _,_,X,_],
      CP: [_,_,_,_, X,_,_,_, _,_,_,_, X,_,_,_],
    },
  },
  {
    id: "boom-bap-909",
    name: "Boom-bap 909",
    origin: "1990s NY tempos, ported",
    bpm: 92,
    swing: 0.12,
    story:
      "not strictly historical — the 909 wasn't a hip-hop machine. but slow it to 92, swing the hats, drop the snare on 2/4 hard, and you can hear how a producer in '92 would have used it if they had one in the studio.",
    steps: {
      BD: [X,_,_,_, _,_,X,_, _,_,_,_, X,_,_,_],
      SD: [_,_,_,_, X,_,_,_, _,_,_,_, X,_,_,_],
      CH: [X,_,X,_, X,_,X,_, X,_,X,_, X,_,X,_],
    },
  },
  {
    id: "blank",
    name: "Blank slate",
    origin: "yours to build",
    bpm: 124,
    swing: 0,
    story: "clean grid. nothing playing. build whatever you want.",
    steps: {},
  },
];

export function presetToRows(preset: Preset): { voice: Voice; steps: boolean[] }[] {
  const voices: Voice[] = ["BD", "SD", "LT", "MT", "HT", "RS", "CP", "CH", "OH"];
  return voices.map((v) => ({
    voice: v,
    steps: preset.steps[v]?.slice() ?? new Array(16).fill(false),
  }));
}
