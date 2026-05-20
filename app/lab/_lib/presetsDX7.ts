import type { DX7Params } from "./engineDX7";

export type DX7Preset = {
  id: string;
  name: string;
  origin: string;
  story: string;
  params: Partial<DX7Params>;
};

export const DX7_PRESETS: DX7Preset[] = [
  {
    id: "bell",
    name: "FM Bell",
    origin: "Whitney 'Greatest Love' / every 80s ballad",
    story:
      "the sound everyone hears in their head when you say 'DX7'. cascading operators with high ratios give that metallic bell character. fast attack, long decay, no sustain — strike + fade.",
    params: {
      algorithm: "cascade",
      ops: [
        { ratio: 1.0,  level: 0.8, attack: 0.001, decay: 1.5, sustain: 0.0, release: 1.0 },
        { ratio: 3.5,  level: 0.6, attack: 0.001, decay: 1.0, sustain: 0.0, release: 0.6 },
        { ratio: 7.0,  level: 0.45, attack: 0.001, decay: 0.8, sustain: 0.0, release: 0.4 },
        { ratio: 14.0, level: 0.35, attack: 0.001, decay: 0.6, sustain: 0.0, release: 0.3 },
      ],
      volume: 0.45,
    },
  },
  {
    id: "epiano",
    name: "E.Piano",
    origin: "PATCH 11 — every TV theme, 1984–1991",
    story:
      "the default electric piano of the 80s. parallel algorithm with a soft attack + medium decay. roughly factory patch 11 territory. carries any chord progression by itself.",
    params: {
      algorithm: "parallel",
      ops: [
        { ratio: 1.0,  level: 0.7, attack: 0.005, decay: 0.5, sustain: 0.45, release: 0.4 },
        { ratio: 1.0,  level: 0.3, attack: 0.005, decay: 0.4, sustain: 0.0, release: 0.3 },
        { ratio: 1.0,  level: 0.6, attack: 0.005, decay: 0.5, sustain: 0.4, release: 0.4 },
        { ratio: 7.0,  level: 0.25, attack: 0.005, decay: 0.3, sustain: 0.0, release: 0.2 },
      ],
      volume: 0.55,
    },
  },
  {
    id: "slap-bass",
    name: "Slap bass",
    origin: "all of Quincy Jones 1985",
    story:
      "PATCH 35 territory. fast attack with a low-ratio modulator gives that 'doink' character. ratio 1.0 carrier with a fast-decaying modulator at ratio 2 creates the slap.",
    params: {
      algorithm: "cascade",
      ops: [
        { ratio: 1.0,  level: 0.9, attack: 0.002, decay: 0.3, sustain: 0.3, release: 0.2 },
        { ratio: 2.0,  level: 0.55, attack: 0.0,  decay: 0.15, sustain: 0.0, release: 0.1 },
        { ratio: 5.0,  level: 0.25, attack: 0.0,  decay: 0.1,  sustain: 0.0, release: 0.05 },
        { ratio: 14.0, level: 0.1, attack: 0.0,  decay: 0.05, sustain: 0.0, release: 0.03 },
      ],
      volume: 0.5,
    },
  },
  {
    id: "breath-pad",
    name: "Breath pad",
    origin: "Brian Eno · Apollo soundtracks",
    story:
      "slow attack, long sustain, low operator levels. eno used FM textures here years before everyone else figured out how. the fan algorithm gives the wash a bit of motion.",
    params: {
      algorithm: "fan",
      ops: [
        { ratio: 1.0, level: 0.6, attack: 0.6, decay: 0.8, sustain: 0.7, release: 1.0 },
        { ratio: 2.0, level: 0.5, attack: 0.8, decay: 0.8, sustain: 0.6, release: 1.2 },
        { ratio: 3.0, level: 0.4, attack: 1.0, decay: 0.8, sustain: 0.5, release: 1.4 },
        { ratio: 7.0, level: 0.15, attack: 0.5, decay: 1.0, sustain: 0.3, release: 0.8 },
      ],
      volume: 0.45,
    },
  },
  {
    id: "init",
    name: "Init",
    origin: "yours to build",
    story: "default patch. just OP1 carrier at ratio 1.0. cascade in some modulation by raising OP2 level + ratio.",
    params: {},
  },
];
