// SID 6581 — 3 voice + shared filter chip synth from the Commodore 64.
//
// We model the iconic parts: 3 independent voices, each with waveform +
// detune + ADSR, all feeding into a shared state-variable filter (lp/hp/bp).
// Per-voice arpeggiator can cycle through 3 intervals at chip-tune speed
// (this is what gives SID arps their character — the chord is actually
// cycling at 50Hz so fast it sounds like a chord).
//
// We don't model ring mod / sync per voice in v0 (could add later).

export type SidWave = "pulse" | "sawtooth" | "triangle" | "noise";
export type FilterMode = "lowpass" | "bandpass" | "highpass" | "off";

export type SidVoiceParams = {
  wave: SidWave;
  detune: number;     // -24..+24 semitones
  level: number;      // 0..1
  attack: number;     // 0..1
  decay: number;
  sustain: number;
  release: number;
  // arp interval in semitones added on the cycle (0 = no arp on this voice)
  arpOffset: number;  // 0..24
};

export type SidParams = {
  voices: [SidVoiceParams, SidVoiceParams, SidVoiceParams];
  cutoff: number;     // 0..1
  resonance: number;  // 0..1
  filterMode: FilterMode;
  arpRate: number;    // 0..1 → 0..50 Hz
  volume: number;
};

export const SID_DEFAULTS: SidParams = {
  voices: [
    { wave: "pulse", detune: 0, level: 0.6, attack: 0.0, decay: 0.3, sustain: 0.6, release: 0.3, arpOffset: 0 },
    { wave: "sawtooth", detune: 12, level: 0.4, attack: 0.0, decay: 0.3, sustain: 0.5, release: 0.3, arpOffset: 4 },
    { wave: "triangle", detune: 19, level: 0.3, attack: 0.0, decay: 0.3, sustain: 0.5, release: 0.3, arpOffset: 7 },
  ],
  cutoff: 0.7,
  resonance: 0.2,
  filterMode: "lowpass",
  arpRate: 0,
  volume: 0.6,
};

type VoiceNodes = {
  osc: OscillatorNode | null;
  noiseSrc: AudioBufferSourceNode | null;
  env: GainNode;
};

export class EngineSID {
  ctx: BaseAudioContext;
  params: SidParams = JSON.parse(JSON.stringify(SID_DEFAULTS));
  master: GainNode;
  private filter: BiquadFilterNode;
  private voices: VoiceNodes[] = [];
  private noiseBuf: AudioBuffer;
  private currentMidi = 60;
  private arpTimer: ReturnType<typeof setInterval> | null = null;
  private arpStep = 0;
  private gateOpen = false;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.params.volume;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 8000;
    this.filter.Q.value = 1;

    this.filter.connect(this.master);
    this.master.connect(ctx.destination);

    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 1, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    // 3 persistent envelope gains; oscillators are rebuilt per note-on so
    // we can swap waveform / noise cleanly.
    for (let i = 0; i < 3; i++) {
      const env = ctx.createGain();
      env.gain.value = 0;
      env.connect(this.filter);
      this.voices.push({ osc: null, noiseSrc: null, env });
    }
  }

  setParam<K extends keyof SidParams>(key: K, val: SidParams[K]) {
    this.params[key] = val;
    if (key === "cutoff" || key === "resonance" || key === "filterMode") this.refreshFilter();
    if (key === "volume") this.master.gain.setTargetAtTime(val as number, this.ctx.currentTime, 0.01);
    if (key === "arpRate") this.refreshArp();
  }

  setVoice(idx: 0|1|2, key: keyof SidVoiceParams, val: SidVoiceParams[K] extends never ? never : SidVoiceParams[keyof SidVoiceParams]) {
    // Loosen typing — runtime check
    (this.params.voices[idx] as Record<string, unknown>)[key as string] = val as unknown;
  }

  private refreshFilter() {
    if (this.params.filterMode === "off") {
      // bypass: very wide lowpass
      this.filter.type = "lowpass";
      this.filter.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.005);
      this.filter.Q.setTargetAtTime(0.3, this.ctx.currentTime, 0.005);
      return;
    }
    this.filter.type = this.params.filterMode;
    const hz = 30 * Math.pow(18000/30, this.params.cutoff);
    this.filter.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.005);
    this.filter.Q.setTargetAtTime(0.5 + this.params.resonance * 15, this.ctx.currentTime, 0.005);
  }

  private refreshArp() {
    if (this.arpTimer) { clearInterval(this.arpTimer); this.arpTimer = null; }
    if (this.params.arpRate <= 0.01) return;
    const hz = this.params.arpRate * 50; // 0..50 Hz
    const ms = 1000 / hz;
    this.arpTimer = setInterval(() => {
      this.arpStep = (this.arpStep + 1) % 3;
      if (this.gateOpen) this.applyPitchesForArp();
    }, Math.max(8, ms));
  }

  private applyPitchesForArp() {
    const base = this.currentMidi;
    this.voices.forEach((v, i) => {
      const vp = this.params.voices[i as 0|1|2];
      // when arp is on, all voices play the same note offset by arpStep’s interval
      const off = this.params.arpRate > 0.01
        ? (this.arpStep === 0 ? 0 : this.arpStep === 1 ? this.params.voices[1].arpOffset : this.params.voices[2].arpOffset)
        : vp.detune;
      const midi = base + off;
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      if (v.osc) v.osc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.001);
    });
  }

  noteOn(midi: number, time?: number) {
    this.currentMidi = midi;
    const t = time ?? this.ctx.currentTime;
    // (re)build each voice's oscillator/noise to honor current waveform setting
    for (let i = 0; i < 3; i++) {
      const v = this.voices[i];
      const vp = this.params.voices[i as 0|1|2];
      try { v.osc?.stop(); } catch {}
      try { v.noiseSrc?.stop(); } catch {}
      v.osc?.disconnect(); v.noiseSrc?.disconnect();
      if (vp.wave === "noise") {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        src.loop = true;
        src.connect(v.env);
        src.start(t);
        v.noiseSrc = src;
        v.osc = null;
      } else {
        const osc = this.ctx.createOscillator();
        osc.type = vp.wave;
        osc.connect(v.env);
        osc.start(t);
        v.osc = osc;
        v.noiseSrc = null;
      }
      // ADSR
      const a = Math.max(0.001, vp.attack);
      const d = Math.max(0.001, vp.decay);
      const s = vp.sustain;
      v.env.gain.cancelScheduledValues(t);
      v.env.gain.setValueAtTime(v.env.gain.value, t);
      v.env.gain.linearRampToValueAtTime(vp.level, t + a);
      v.env.gain.linearRampToValueAtTime(vp.level * s, t + a + d);
    }
    this.gateOpen = true;
    this.arpStep = 0;
    this.applyPitchesForArp();
  }

  noteOff(time?: number) {
    if (!this.gateOpen) return;
    const t = time ?? this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const v = this.voices[i];
      const vp = this.params.voices[i as 0|1|2];
      const r = Math.max(0.005, vp.release);
      v.env.gain.cancelScheduledValues(t);
      v.env.gain.setValueAtTime(v.env.gain.value, t);
      v.env.gain.linearRampToValueAtTime(0, t + r);
    }
    this.gateOpen = false;
  }
}
