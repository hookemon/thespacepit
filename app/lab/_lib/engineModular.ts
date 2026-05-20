// Modular synth voice. Six modules — VCO1, VCO2, LFO, VCF, ENV, VCA — wired
// according to a selectable "patch program." We don't expose live cable
// dragging in v0; instead, three preset patches reconfigure the signal flow.
// Every knob on every module is still live; only the routing changes per
// patch.

export type PatchProgram = "basic" | "fm-lead" | "pulse-pad";

export type ModularParams = {
  program: PatchProgram;
  // VCO1 (primary)
  vco1Wave: OscillatorType;
  vco1Tune: number;       // -12..+12 semitones
  // VCO2 (sub / FM modulator)
  vco2Wave: OscillatorType;
  vco2Ratio: number;      // 0.25..16 — relative to VCO1 freq
  vco2Level: number;      // 0..1
  // LFO
  lfoRate: number;        // 0..1 → 0..20 Hz
  lfoAmount: number;      // 0..1
  // VCF
  vcfCutoff: number;      // 0..1
  vcfResonance: number;   // 0..1
  vcfEnv: number;         // 0..1 — env modulation depth
  // ENV
  envA: number;
  envD: number;
  envS: number;
  envR: number;
  // Master
  volume: number;
};

export const MOD_DEFAULTS: ModularParams = {
  program: "basic",
  vco1Wave: "sawtooth",
  vco1Tune: 0,
  vco2Wave: "sine",
  vco2Ratio: 2,
  vco2Level: 0.0,
  lfoRate: 0.2,
  lfoAmount: 0,
  vcfCutoff: 0.5,
  vcfResonance: 0.3,
  vcfEnv: 0.5,
  envA: 0.02,
  envD: 0.3,
  envS: 0.6,
  envR: 0.3,
  volume: 0.6,
};

export class EngineModular {
  ctx: BaseAudioContext;
  params: ModularParams = { ...MOD_DEFAULTS };

  private vco1: OscillatorNode;
  private vco2: OscillatorNode;
  private vco2Gain: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private vcf: BiquadFilterNode;
  private vcfEnvGain: GainNode; // env → cutoff modulation
  private vca: GainNode;
  private master: GainNode;
  private currentHz = 220;
  private gateOpen = false;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.params.volume;
    this.master.connect(ctx.destination);

    this.vco1 = ctx.createOscillator();
    this.vco1.type = this.params.vco1Wave;
    this.vco1.frequency.value = this.currentHz;

    this.vco2 = ctx.createOscillator();
    this.vco2.type = this.params.vco2Wave;
    this.vco2.frequency.value = this.currentHz * this.params.vco2Ratio;

    this.vco2Gain = ctx.createGain();
    this.vco2Gain.gain.value = this.params.vco2Level;

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = this.params.lfoRate * 20;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0;

    this.vcf = ctx.createBiquadFilter();
    this.vcf.type = "lowpass";
    this.vcf.frequency.value = 1000;
    this.vcf.Q.value = 1 + this.params.vcfResonance * 10;

    this.vcfEnvGain = ctx.createGain();
    this.vcfEnvGain.gain.value = 0;

    this.vca = ctx.createGain();
    this.vca.gain.value = 0;

    this.vco1.start();
    this.vco2.start();
    this.lfo.start();

    this.applyProgram();
  }

  setParam<K extends keyof ModularParams>(key: K, val: ModularParams[K]) {
    this.params[key] = val;
    const t = this.ctx.currentTime;
    switch (key) {
      case "program": return this.applyProgram();
      case "vco1Wave": this.vco1.type = val as OscillatorType; return;
      case "vco2Wave": this.vco2.type = val as OscillatorType; return;
      case "vco2Ratio": this.vco2.frequency.setTargetAtTime(this.currentHz * (val as number), t, 0.01); return;
      case "vco2Level": this.vco2Gain.gain.setTargetAtTime(val as number, t, 0.005); return;
      case "lfoRate": this.lfo.frequency.setTargetAtTime((val as number) * 20, t, 0.01); return;
      case "lfoAmount": this.lfoGain.gain.setTargetAtTime((val as number) * (this.params.program === "pulse-pad" ? 4000 : 50), t, 0.01); return;
      case "vcfCutoff": this.updateCutoff(); return;
      case "vcfResonance": this.vcf.Q.setTargetAtTime(1 + (val as number) * 10, t, 0.005); return;
      case "vcfEnv": this.vcfEnvGain.gain.setTargetAtTime((val as number) * 6000, t, 0.005); return;
      case "volume": this.master.gain.setTargetAtTime(val as number, t, 0.01); return;
    }
  }

  private updateCutoff() {
    const baseHz = 30 * Math.pow(18000/30, this.params.vcfCutoff);
    this.vcf.frequency.setTargetAtTime(baseHz, this.ctx.currentTime, 0.005);
  }

  // Disconnect all module outputs, then re-wire according to the program.
  private applyProgram() {
    try { this.vco1.disconnect(); } catch {}
    try { this.vco2.disconnect(); } catch {}
    try { this.vco2Gain.disconnect(); } catch {}
    try { this.lfo.disconnect(); } catch {}
    try { this.lfoGain.disconnect(); } catch {}
    try { this.vcf.disconnect(); } catch {}
    try { this.vcfEnvGain.disconnect(); } catch {}
    try { this.vca.disconnect(); } catch {}

    // Common chain end: VCF → VCA → master
    this.vcf.connect(this.vca).connect(this.master);
    // The env modulates the VCA gain directly via lfoGain? No — env timing is
    // applied directly to vca.gain in noteOn/Off. vcfEnvGain is a passive
    // gain whose value we set in noteOn for filter sweep.
    this.vcfEnvGain.connect(this.vcf.frequency);

    switch (this.params.program) {
      case "basic": {
        // VCO1 → VCF → VCA. LFO disconnected.
        this.vco1.connect(this.vcf);
        // small amount of VCO2 mix if user dials it up — straight into VCF
        this.vco2.connect(this.vco2Gain).connect(this.vcf);
        this.lfoGain.gain.value = 0;
        break;
      }
      case "fm-lead": {
        // VCO2 modulates VCO1.frequency (FM). VCO1 → VCF → VCA.
        this.vco1.connect(this.vcf);
        this.vco2.connect(this.vco2Gain).connect(this.vco1.frequency);
        // LFO disconnected by default
        this.lfoGain.gain.value = 0;
        break;
      }
      case "pulse-pad": {
        // VCO1 + VCO2 sum → VCF. LFO → VCF.cutoff for a slow sweep.
        this.vco1.connect(this.vcf);
        this.vco2.connect(this.vco2Gain).connect(this.vcf);
        this.lfo.connect(this.lfoGain).connect(this.vcf.frequency);
        // initialize lfo amount to whatever the param says
        this.lfoGain.gain.value = this.params.lfoAmount * 4000;
        break;
      }
    }
  }

  noteOn(hz: number, time?: number) {
    const t = time ?? this.ctx.currentTime;
    this.currentHz = hz;
    // pitch: VCO1 at hz * tune semitones, VCO2 at hz * ratio
    const detuneRatio = Math.pow(2, this.params.vco1Tune / 12);
    this.vco1.frequency.setValueAtTime(hz * detuneRatio, t);
    this.vco2.frequency.setValueAtTime(hz * this.params.vco2Ratio, t);

    const a = Math.max(0.001, this.params.envA);
    const d = Math.max(0.001, this.params.envD);
    const s = this.params.envS;

    // VCA env
    this.vca.gain.cancelScheduledValues(t);
    this.vca.gain.setValueAtTime(this.vca.gain.value, t);
    this.vca.gain.linearRampToValueAtTime(0.8, t + a);
    this.vca.gain.linearRampToValueAtTime(0.8 * s, t + a + d);

    // VCF env — sweep cutoff up then back to sustain
    this.vcfEnvGain.gain.cancelScheduledValues(t);
    this.vcfEnvGain.gain.setValueAtTime(this.vcfEnvGain.gain.value, t);
    const peakOffset = this.params.vcfEnv * 6000;
    this.vcfEnvGain.gain.linearRampToValueAtTime(peakOffset, t + a);
    this.vcfEnvGain.gain.linearRampToValueAtTime(peakOffset * s, t + a + d);

    this.gateOpen = true;
  }

  noteOff(time?: number) {
    if (!this.gateOpen) return;
    const t = time ?? this.ctx.currentTime;
    const r = Math.max(0.005, this.params.envR);
    this.vca.gain.cancelScheduledValues(t);
    this.vca.gain.setValueAtTime(this.vca.gain.value, t);
    this.vca.gain.linearRampToValueAtTime(0, t + r);
    this.vcfEnvGain.gain.cancelScheduledValues(t);
    this.vcfEnvGain.gain.setValueAtTime(this.vcfEnvGain.gain.value, t);
    this.vcfEnvGain.gain.linearRampToValueAtTime(0, t + r);
    this.gateOpen = false;
  }
}
