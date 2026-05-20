// SP-1200 sample-player engine.
//
// The real machine was 12-bit, 26.04 kHz. We approximate that character
// with two cheap nodes in series:
//   1. lowpass filter at ~13 kHz (the SP eats top-end above its Nyquist)
//   2. a WaveShaperNode with a 12-bit quantization curve (adds the famous
//      crunchy, dusty noise floor)
// Then per-pad pitch via AudioBufferSourceNode.playbackRate — pitch up = play
// faster = play higher + shorter, which is the original "to fit more sample
// in 10 seconds of memory we tuned it up" hip-hop trick.
//
// Engine state is 8 pads, each with their own loaded sample + params.

export type PadId = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8";

export const PAD_ORDER: PadId[] = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

export type PadParams = {
  level: number;     // 0..1
  pitch: number;     // -24..+24 semitones
  decay: number;     // 0..1 — fades the gain (0 = full-length, 1 = ~3s, exponential)
  loaded: boolean;
  sampleName?: string;
};

export const PAD_DEFAULTS: PadParams = {
  level: 0.85,
  pitch: 0,
  decay: 0,
  loaded: false,
};

// Build a 12-bit quantization curve once and reuse.
const BIT_DEPTH = 12;
function buildBitCrushCurve(): Float32Array {
  const steps = 2 ** BIT_DEPTH;
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1; // -1..+1
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}
const BIT_CRUSH_CURVE = buildBitCrushCurve();

export class EngineSP1200 {
  ctx: BaseAudioContext;
  master: GainNode;
  pads: Record<PadId, PadParams>;
  buffers: Record<PadId, AudioBuffer | null> = {
    P1: null, P2: null, P3: null, P4: null, P5: null, P6: null, P7: null, P8: null,
  };

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(ctx.destination);
    this.pads = Object.fromEntries(
      PAD_ORDER.map((p) => [p, { ...PAD_DEFAULTS }])
    ) as Record<PadId, PadParams>;
  }

  loadBuffer(pad: PadId, buffer: AudioBuffer, name?: string) {
    this.buffers[pad] = buffer;
    this.pads[pad] = { ...this.pads[pad], loaded: true, sampleName: name };
  }

  setParam<K extends keyof PadParams>(pad: PadId, key: K, val: PadParams[K]) {
    this.pads[pad][key] = val;
  }

  getParams(pad: PadId): PadParams {
    return this.pads[pad];
  }

  trigger(pad: PadId, time: number, velocity = 1) {
    const buf = this.buffers[pad];
    if (!buf) return;
    const p = this.pads[pad];
    const t = Math.max(time, this.ctx.currentTime);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, p.pitch / 12);

    // SP-1200 character chain
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 13000;
    lp.Q.value = 0.5;

    const crush = this.ctx.createWaveShaper();
    crush.curve = BIT_CRUSH_CURVE;
    crush.oversample = "none"; // SP didn't oversample — keep it nasty

    // amp envelope — short decay if requested, otherwise let the sample play out
    const amp = this.ctx.createGain();
    const peak = p.level * velocity;
    amp.gain.setValueAtTime(peak, t);
    if (p.decay > 0.01) {
      const decaySec = 0.04 + p.decay * 3.0;
      amp.gain.exponentialRampToValueAtTime(0.001, t + decaySec);
    }

    src.connect(lp).connect(crush).connect(amp).connect(this.master);
    src.start(t);
    // safety stop
    src.stop(t + (buf.duration / src.playbackRate.value) + 0.1);
  }
}

// Convenience: decode a fetched ArrayBuffer (or File) into an AudioBuffer.
export async function decodeIntoEngine(
  engine: EngineSP1200,
  pad: PadId,
  data: ArrayBuffer,
  name?: string
) {
  // Use the existing context (works with AudioContext + OfflineAudioContext)
  const ctx = engine.ctx as AudioContext;
  // decodeAudioData requires a transferable ArrayBuffer; slice() makes a copy
  // so callers can reuse the original if they want.
  const buffer = await ctx.decodeAudioData(data.slice(0));
  engine.loadBuffer(pad, buffer, name);
}
