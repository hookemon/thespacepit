// Seed the SP-1200 room with starter samples so it's immediately playable.
// We render one-shots from the 909 engine offline + load them into SP pads.
// First 4 pads come pre-loaded: kick, snare, closed hat, open hat.
// Pads 5–8 are intentionally empty — drop your own samples in.

import { renderVoiceOneshot } from "./export";
import type { Voice, VoiceParams } from "./engine909";
import type { EngineSP1200, PadId } from "./engineSP1200";

const SEED_MAP: { voice: Voice; pad: PadId; label: string }[] = [
  { voice: "BD", pad: "P1", label: "909 kick" },
  { voice: "SD", pad: "P2", label: "909 snare" },
  { voice: "CH", pad: "P3", label: "909 closed hat" },
  { voice: "OH", pad: "P4", label: "909 open hat" },
];

// Sensible defaults for the 909 voices we're rendering — match the live room.
const DEFAULT_909_PARAMS: Record<Voice, VoiceParams> = {
  BD: { level: 1.0, tune: 0, decay: 0.45 },
  SD: { level: 0.85, tune: 0, decay: 0.35, tone: 0.5, snappy: 0.5 },
  LT: { level: 0.8, tune: -0.3, decay: 0.55 },
  MT: { level: 0.8, tune: 0, decay: 0.5 },
  HT: { level: 0.8, tune: 0.3, decay: 0.45 },
  RS: { level: 0.7, tune: 0, decay: 0.1 },
  CP: { level: 0.85, tune: 0, decay: 0.4, tone: 0.3 },
  CH: { level: 0.7, tune: 0, decay: 0.08 },
  OH: { level: 0.7, tune: 0, decay: 0.4 },
};

export async function seedSP1200WithDrums(engine: EngineSP1200) {
  for (const { voice, pad, label } of SEED_MAP) {
    try {
      const buf = await renderVoiceOneshot(voice, DEFAULT_909_PARAMS);
      engine.loadBuffer(pad, buf, label);
    } catch (e) {
      console.warn(`SP1200 seed failed for ${voice}`, e);
    }
  }
}
