// Monophonic subtractive synth voice modeled on a Minimoog-ish signal chain:
//
//   OSC1 + SUB(sq -1 oct) → MIX → 4-pole-ish lowpass (2 cascaded biquads) → VCA → out
//                                       ↑                                    ↑
//                                  filter env                            amp env
//
// Real Moogs are 24dB/oct (4-pole) ladder filters; we approximate with two
// cascaded 2-pole biquads. Close enough for the lesson — and easy to extend
// to a true ladder if we want later.

export type Waveform = "sawtooth" | "square" | "triangle" | "sine";

export type MoogParams = {
  // OSC
  waveform: Waveform;
  detune: number;         // -50..+50 cents
  pulseWidth: number;     // 0.05..0.95 (only relevant for square if we use PWM later; informational)
  subLevel: number;       // 0..1
  // FILTER
  cutoff: number;         // 0..1 (mapped to 30Hz..18kHz exponential)
  resonance: number;      // 0..1 (Q from 0.5..18)
  envAmount: number;      // 0..1 — how much the filter env modulates cutoff
  // FILTER ENV
  fAttack: number;        // 0..1
  fDecay: number;
  fSustain: number;
  fRelease: number;
  // AMP ENV
  aAttack: number;
  aDecay: number;
  aSustain: number;
  aRelease: number;
  // GLOBAL
  glide: number;          // 0..1 (mapped to 0..0.5s)
  volume: number;         // 0..1
};

export const MOOG_DEFAULTS: MoogParams = {
  waveform: "sawtooth",
  detune: 0,
  pulseWidth: 0.5,
  subLevel: 0.4,

  cutoff: 0.5,
  resonance: 0.35,
  envAmount: 0.6,

  fAttack: 0.05,
  fDecay: 0.35,
  fSustain: 0.4,
  fRelease: 0.3,

  aAttack: 0.02,
  aDecay: 0.3,
  aSustain: 0.7,
  aRelease: 0.2,

  glide: 0,
  volume: 0.7,
};

// Exponential mapping helpers
const expRange = (v: number, min: number, max: number) =>
  min * Math.pow(max / min, v);

export class EngineMoog {
  ctx: BaseAudioContext;
  params: MoogParams = { ...MOOG_DEFAULTS };

  // Persistent nodes — one mono voice, kept alive
  private osc: OscillatorNode;
  private sub: OscillatorNode;
  private oscGain: GainNode;
  private subGain: GainNode;
  private filter1: BiquadFilterNode;
  private filter2: BiquadFilterNode;
  private vca: GainNode;
  master: GainNode;

  private currentNoteHz = 220;
  private gateOpen = false;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;

    this.osc = ctx.createOscillator();
    this.osc.type = this.params.waveform;
    this.osc.frequency.value = this.currentNoteHz;

    this.sub = ctx.createOscillator();
    this.sub.type = "square";
    this.sub.frequency.value = this.currentNoteHz / 2;

    this.oscGain = ctx.createGain();
    this.oscGain.gain.value = 1.0;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = this.params.subLevel;

    this.filter1 = ctx.createBiquadFilter();
    this.filter1.type = "lowpass";
    this.filter1.frequency.value = this.cutoffHz();
    this.filter1.Q.value = this.resonanceQ();

    this.filter2 = ctx.createBiquadFilter();
    this.filter2.type = "lowpass";
    this.filter2.frequency.value = this.cutoffHz();
    this.filter2.Q.value = 0.5; // light Q on the second stage to avoid ringing-on-ringing

    this.vca = ctx.createGain();
    this.vca.gain.value = 0;

    this.master = ctx.createGain();
    this.master.gain.value = this.params.volume;

    // wire
    this.osc.connect(this.oscGain).connect(this.filter1);
    this.sub.connect(this.subGain).connect(this.filter1);
    this.filter1.connect(this.filter2).connect(this.vca).connect(this.master);
    this.master.connect(ctx.destination);

    this.osc.start();
    this.sub.start();
  }

  setParam<K extends keyof MoogParams>(key: K, val: MoogParams[K]) {
    this.params[key] = val;
    switch (key) {
      case "waveform":
        this.osc.type = val as Waveform;
        break;
      case "detune":
        this.osc.detune.value = val as number;
        break;
      case "subLevel":
        this.subGain.gain.setTargetAtTime(val as number, this.ctx.currentTime, 0.01);
        break;
      case "cutoff":
      case "resonance":
        this.filter1.frequency.setTargetAtTime(this.cutoffHz(), this.ctx.currentTime, 0.005);
        this.filter1.Q.setTargetAtTime(this.resonanceQ(), this.ctx.currentTime, 0.005);
        this.filter2.frequency.setTargetAtTime(this.cutoffHz(), this.ctx.currentTime, 0.005);
        break;
      case "volume":
        this.master.gain.setTargetAtTime(val as number, this.ctx.currentTime, 0.01);
        break;
    }
  }

  private cutoffHz() {
    return expRange(this.params.cutoff, 30, 18000);
  }
  private resonanceQ() {
    // 0..1 → 0.5..18
    return 0.5 + this.params.resonance * 17.5;
  }

  // ---- note-on / note-off ----
  noteOn(hz: number, time?: number) {
    const t = time ?? this.ctx.currentTime;
    const glideTime = this.params.glide * 0.5;
    if (glideTime > 0.001 && this.gateOpen) {
      this.osc.frequency.cancelScheduledValues(t);
      this.osc.frequency.setValueAtTime(this.osc.frequency.value, t);
      this.osc.frequency.exponentialRampToValueAtTime(hz, t + glideTime);
      this.sub.frequency.cancelScheduledValues(t);
      this.sub.frequency.setValueAtTime(this.sub.frequency.value, t);
      this.sub.frequency.exponentialRampToValueAtTime(hz / 2, t + glideTime);
    } else {
      this.osc.frequency.setValueAtTime(hz, t);
      this.sub.frequency.setValueAtTime(hz / 2, t);
    }
    this.currentNoteHz = hz;

    const aA = Math.max(0.001, this.params.aAttack * 1.5);
    const aD = Math.max(0.001, this.params.aDecay * 1.5);
    const aS = this.params.aSustain;

    const fA = Math.max(0.001, this.params.fAttack * 1.5);
    const fD = Math.max(0.001, this.params.fDecay * 1.5);
    const fS = this.params.fSustain;

    // amp env
    this.vca.gain.cancelScheduledValues(t);
    this.vca.gain.setValueAtTime(this.vca.gain.value, t);
    this.vca.gain.linearRampToValueAtTime(0.8, t + aA);
    this.vca.gain.linearRampToValueAtTime(aS * 0.8, t + aA + aD);

    // filter env (modulates cutoff)
    const baseHz = this.cutoffHz();
    const peakHz = Math.min(18000, baseHz + this.params.envAmount * 10000);
    const sustainHz = baseHz + (peakHz - baseHz) * fS;

    [this.filter1, this.filter2].forEach((f) => {
      f.frequency.cancelScheduledValues(t);
      f.frequency.setValueAtTime(baseHz, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, peakHz), t + fA);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, sustainHz), t + fA + fD);
    });

    this.gateOpen = true;
  }

  noteOff(time?: number) {
    if (!this.gateOpen) return;
    const t = time ?? this.ctx.currentTime;
    const aR = Math.max(0.005, this.params.aRelease * 1.5);
    const fR = Math.max(0.005, this.params.fRelease * 1.5);

    this.vca.gain.cancelScheduledValues(t);
    this.vca.gain.setValueAtTime(this.vca.gain.value, t);
    this.vca.gain.linearRampToValueAtTime(0, t + aR);

    const baseHz = this.cutoffHz();
    [this.filter1, this.filter2].forEach((f) => {
      f.frequency.cancelScheduledValues(t);
      f.frequency.setValueAtTime(f.frequency.value, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, baseHz), t + fR);
    });

    this.gateOpen = false;
  }

  panic() {
    this.vca.gain.cancelScheduledValues(this.ctx.currentTime);
    this.vca.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gateOpen = false;
  }
}

// Helpers for keyboard ↔ frequency
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToName(midi: number) {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}
