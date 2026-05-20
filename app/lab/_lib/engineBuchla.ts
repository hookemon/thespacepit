// Buchla 200 series-ish voice — west-coast synthesis.
//
// What's different from subtractive:
//   - The "complex oscillator" has two coupled oscillators with FM between
//     them. Modulating one's index drastically reshapes the timbre.
//   - The "lowpass gate" (LPG) is one envelope that opens *both* a lowpass
//     filter and an amplitude gate at once. So loud == open == bright.
//     Quiet == closed == muffled. The classic "bonk" sound is an LPG.
//   - No piano keyboard. Touch plates fire shaped envelopes.
//   - "Source of Uncertainty" — slowly-changing random voltage that
//     modulates whatever you patch it to.

export type PlateShape = "bonk" | "swell" | "pluck" | "drone";

export type BuchlaParams = {
  baseHz: number;
  timbre: number;     // 0..1 — FM index (osc1 → osc2 freq mod depth)
  shape: number;      // 0..1 — wave-shape distortion amount
  cutoff: number;     // 0..1 — LPG resting cutoff (closed → open)
  decay: number;      // 0..1 — LPG decay time
  randomAmt: number;  // 0..1 — how much SoU modulates timbre
  volume: number;     // 0..1
};

export const BUCHLA_DEFAULTS: BuchlaParams = {
  baseHz: 220,
  timbre: 0.35,
  shape: 0.4,
  cutoff: 0.15,
  decay: 0.6,
  randomAmt: 0.3,
  volume: 0.6,
};

// Build a shape-distortion curve once — soft saturation, more aggressive
// as amount goes up.
function buildShapeCurve(amount: number): Float32Array {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = 1 + amount * 24;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

export class EngineBuchla {
  ctx: BaseAudioContext;
  params: BuchlaParams = { ...BUCHLA_DEFAULTS };

  private osc1: OscillatorNode; // modulator
  private osc2: OscillatorNode; // primary
  private fmGain: GainNode;
  private shaper: WaveShaperNode;
  private lpgFilter: BiquadFilterNode;
  private lpgAmp: GainNode;
  private master: GainNode;

  // Source of Uncertainty
  private sou = 0;
  private souTimer: ReturnType<typeof setInterval> | null = null;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.params.volume;

    this.osc1 = ctx.createOscillator();
    this.osc1.type = "sine";
    this.osc1.frequency.value = this.params.baseHz * 0.5; // sub frequency by default

    this.osc2 = ctx.createOscillator();
    this.osc2.type = "triangle";
    this.osc2.frequency.value = this.params.baseHz;

    this.fmGain = ctx.createGain();
    this.fmGain.gain.value = this.params.timbre * this.params.baseHz * 4;

    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = buildShapeCurve(this.params.shape);
    this.shaper.oversample = "2x";

    this.lpgFilter = ctx.createBiquadFilter();
    this.lpgFilter.type = "lowpass";
    this.lpgFilter.frequency.value = 200;
    this.lpgFilter.Q.value = 1.5;

    this.lpgAmp = ctx.createGain();
    this.lpgAmp.gain.value = 0;

    // wire: osc1 → fmGain → osc2.frequency
    // osc2 → shaper → lpgFilter → lpgAmp → master → destination
    this.osc1.connect(this.fmGain);
    this.fmGain.connect(this.osc2.frequency);
    this.osc2.connect(this.shaper).connect(this.lpgFilter).connect(this.lpgAmp).connect(this.master);
    this.master.connect(ctx.destination);

    this.osc1.start();
    this.osc2.start();

    // Tick SoU at ~10Hz: smooth random walk
    this.souTimer = setInterval(() => {
      const next = (Math.random() * 2 - 1);
      this.sou = this.sou * 0.7 + next * 0.3;
      this.applyModulation();
    }, 100);
  }

  setParam<K extends keyof BuchlaParams>(key: K, val: BuchlaParams[K]) {
    this.params[key] = val;
    const t = this.ctx.currentTime;
    if (key === "volume") this.master.gain.setTargetAtTime(val as number, t, 0.01);
    if (key === "baseHz") {
      this.osc1.frequency.setTargetAtTime((val as number) * 0.5, t, 0.005);
      this.osc2.frequency.setTargetAtTime(val as number, t, 0.005);
    }
    if (key === "shape") this.shaper.curve = buildShapeCurve(val as number);
    if (key === "timbre" || key === "randomAmt") this.applyModulation();
  }

  private applyModulation() {
    const modded = this.params.timbre * (1 + this.sou * this.params.randomAmt);
    const depth = Math.max(0, modded) * this.params.baseHz * 4;
    this.fmGain.gain.setTargetAtTime(depth, this.ctx.currentTime, 0.005);
  }

  // Touch-plate trigger. Each plate has a different envelope shape.
  trigger(plate: PlateShape, time?: number) {
    const t = time ?? this.ctx.currentTime;
    const baseDecay = 0.1 + this.params.decay * 2;
    const baseCutoffHz = 80 + this.params.cutoff * 5000;
    const peakCutoffHz = Math.min(15000, baseCutoffHz + 8000);
    const peakAmp = 0.9;

    // Each plate shape: (attack, decay, peakMult, sustainPortion)
    const shapes: Record<PlateShape, { a: number; d: number; peak: number; sus: number; rel: number }> = {
      bonk:  { a: 0.001, d: baseDecay * 0.3, peak: 1.0, sus: 0.0, rel: 0.1 },
      swell: { a: baseDecay * 0.5, d: baseDecay * 0.5, peak: 0.85, sus: 0.6, rel: baseDecay },
      pluck: { a: 0.001, d: baseDecay * 0.15, peak: 1.0, sus: 0.3, rel: 0.2 },
      drone: { a: baseDecay * 0.3, d: 0.2, peak: 0.8, sus: 0.9, rel: baseDecay * 2 },
    };
    const sh = shapes[plate];

    // LPG: gate + filter together
    this.lpgAmp.gain.cancelScheduledValues(t);
    this.lpgAmp.gain.setValueAtTime(this.lpgAmp.gain.value, t);
    this.lpgAmp.gain.linearRampToValueAtTime(peakAmp * sh.peak, t + sh.a);
    this.lpgAmp.gain.linearRampToValueAtTime(peakAmp * sh.peak * sh.sus, t + sh.a + sh.d);

    this.lpgFilter.frequency.cancelScheduledValues(t);
    this.lpgFilter.frequency.setValueAtTime(baseCutoffHz, t);
    this.lpgFilter.frequency.exponentialRampToValueAtTime(peakCutoffHz, t + sh.a);
    this.lpgFilter.frequency.exponentialRampToValueAtTime(Math.max(50, baseCutoffHz + (peakCutoffHz - baseCutoffHz) * sh.sus), t + sh.a + sh.d);

    // For non-drone plates auto-release shortly after
    if (plate !== "drone") {
      const offT = t + sh.a + sh.d + 0.05;
      this.lpgAmp.gain.linearRampToValueAtTime(0, offT + sh.rel);
      this.lpgFilter.frequency.exponentialRampToValueAtTime(Math.max(50, baseCutoffHz), offT + sh.rel);
    }
  }

  release(time?: number) {
    const t = time ?? this.ctx.currentTime;
    const r = 0.2 + this.params.decay * 1.5;
    this.lpgAmp.gain.cancelScheduledValues(t);
    this.lpgAmp.gain.setValueAtTime(this.lpgAmp.gain.value, t);
    this.lpgAmp.gain.linearRampToValueAtTime(0, t + r);
  }

  dispose() {
    if (this.souTimer) clearInterval(this.souTimer);
  }
}
