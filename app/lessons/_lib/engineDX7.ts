// 4-operator FM synth, modeled on the simpler half of a DX7 patch.
//
// In FM synthesis, "operators" are sine-wave oscillators wired in particular
// ways. A "modulator" feeds another operator's frequency (Web Audio supports
// this directly: osc.connect(gain).connect(carrier.frequency)). A "carrier"
// is an operator whose output goes to the speakers. Connecting them in
// different ways gives radically different timbres — and that whole graph
// is called an "algorithm" on the DX7.
//
// We implement 3 algorithms with 4 operators (OP1–OP4):
//   alg-cascade  : 4 → 3 → 2 → 1 (bell, electric piano)
//   alg-parallel : 4 → 3 + 2 → 1 (two sub-tones; lush)
//   alg-fan      : 4 → 1, 4 → 2, 4 → 3 (one mod / three carriers)

export type Algorithm = "cascade" | "parallel" | "fan";

export type OpParams = {
  ratio: number;     // frequency ratio (1.0 = note frequency, 2.0 = octave up, 3.0 = perfect 12th, etc.)
  level: number;     // 0..1 — output level (carrier) or modulation depth (modulator)
  attack: number;    // 0..1
  decay: number;     // 0..1
  sustain: number;   // 0..1
  release: number;   // 0..1
};

export type DX7Params = {
  algorithm: Algorithm;
  ops: [OpParams, OpParams, OpParams, OpParams];
  volume: number;
};

export const DX7_DEFAULTS: DX7Params = {
  algorithm: "cascade",
  ops: [
    { ratio: 1.0,  level: 0.8, attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.3 },
    { ratio: 3.5,  level: 0.6, attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.3 },
    { ratio: 7.0,  level: 0.45, attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.3 },
    { ratio: 14.0, level: 0.3, attack: 0.01, decay: 0.6, sustain: 0.05, release: 0.3 },
  ],
  volume: 0.5,
};

type OpNodes = {
  osc: OscillatorNode;
  envGain: GainNode;       // modulated by envelope
};

export class EngineDX7 {
  ctx: BaseAudioContext;
  params: DX7Params = JSON.parse(JSON.stringify(DX7_DEFAULTS));
  master: GainNode;
  private ops: OpNodes[];
  private mixToMaster: GainNode; // output mix
  private gateOpen = false;
  private currentHz = 220;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.params.volume;

    this.mixToMaster = ctx.createGain();
    this.mixToMaster.gain.value = 1;
    this.mixToMaster.connect(this.master);
    this.master.connect(ctx.destination);

    this.ops = [0, 1, 2, 3].map(() => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const envGain = ctx.createGain();
      envGain.gain.value = 0;
      osc.connect(envGain);
      osc.start();
      return { osc, envGain };
    });

    this.applyAlgorithm();
  }

  setParam<K extends keyof DX7Params>(key: K, val: DX7Params[K]) {
    this.params[key] = val;
    if (key === "algorithm") this.applyAlgorithm();
    if (key === "volume") this.master.gain.setTargetAtTime(val as number, this.ctx.currentTime, 0.01);
  }

  setOp(opIdx: 0 | 1 | 2 | 3, key: keyof OpParams, val: number) {
    this.params.ops[opIdx][key] = val;
  }

  private disconnectAll() {
    for (const op of this.ops) op.envGain.disconnect();
  }

  private applyAlgorithm() {
    this.disconnectAll();
    const [op1, op2, op3, op4] = this.ops;
    // op1 is always the final-stage carrier (or at least one of them)
    switch (this.params.algorithm) {
      case "cascade": {
        // op4 modulates op3, op3 modulates op2, op2 modulates op1, op1 → out
        op4.envGain.connect(op3.osc.frequency);
        op3.envGain.connect(op2.osc.frequency);
        op2.envGain.connect(op1.osc.frequency);
        op1.envGain.connect(this.mixToMaster);
        break;
      }
      case "parallel": {
        // (op4 → op3) and (op2 → op1) — both summed
        op4.envGain.connect(op3.osc.frequency);
        op3.envGain.connect(this.mixToMaster);
        op2.envGain.connect(op1.osc.frequency);
        op1.envGain.connect(this.mixToMaster);
        break;
      }
      case "fan": {
        // op4 modulates op3, op2, op1 — each is a carrier
        op4.envGain.connect(op3.osc.frequency);
        op4.envGain.connect(op2.osc.frequency);
        op4.envGain.connect(op1.osc.frequency);
        op3.envGain.connect(this.mixToMaster);
        op2.envGain.connect(this.mixToMaster);
        op1.envGain.connect(this.mixToMaster);
        break;
      }
    }
  }

  // Determine whether each op is a carrier or a modulator under the current
  // algorithm. Carriers get scaled to audio levels; modulators get scaled by
  // the carrier's expected freq * a depth factor (so you actually hear the FM).
  private opIsCarrier(idx: number): boolean {
    if (this.params.algorithm === "cascade") return idx === 0;
    if (this.params.algorithm === "parallel") return idx === 0 || idx === 2;
    if (this.params.algorithm === "fan") return idx === 0 || idx === 1 || idx === 2;
    return false;
  }

  noteOn(hz: number, time?: number) {
    const t = time ?? this.ctx.currentTime;
    this.currentHz = hz;
    // Set each op's freq + retrigger its envelope.
    this.ops.forEach((op, idx) => {
      const params = this.params.ops[idx];
      op.osc.frequency.setValueAtTime(hz * params.ratio, t);

      const peak = this.opIsCarrier(idx)
        ? params.level
        : params.level * hz * 4; // modulators output at audio rate but we scale up so the modulation actually rings

      const a = Math.max(0.001, params.attack);
      const d = Math.max(0.001, params.decay);
      const s = params.sustain;

      op.envGain.gain.cancelScheduledValues(t);
      op.envGain.gain.setValueAtTime(op.envGain.gain.value, t);
      op.envGain.gain.linearRampToValueAtTime(peak, t + a);
      op.envGain.gain.linearRampToValueAtTime(peak * s, t + a + d);
    });
    this.gateOpen = true;
  }

  noteOff(time?: number) {
    if (!this.gateOpen) return;
    const t = time ?? this.ctx.currentTime;
    this.ops.forEach((op, idx) => {
      const params = this.params.ops[idx];
      const r = Math.max(0.005, params.release);
      op.envGain.gain.cancelScheduledValues(t);
      op.envGain.gain.setValueAtTime(op.envGain.gain.value, t);
      op.envGain.gain.linearRampToValueAtTime(0, t + r);
    });
    this.gateOpen = false;
  }
}
