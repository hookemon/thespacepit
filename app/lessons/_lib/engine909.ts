// TR-909 synthesis engine. Models the original analog/digital hybrid voices
// with raw Web Audio nodes. Each voice has a small set of params that
// roughly mirror the front-panel controls on the actual machine.
//
// Why custom synthesis instead of samples? Because the lab is about
// learning what the knobs DO. A sample is a frozen patch. Real circuits
// let you push past the factory presets — push the kick tune up and it
// becomes a tom, push the decay long and it becomes a sub bass.

export type Voice =
  | "BD"  // bass drum
  | "SD"  // snare drum
  | "LT"  // low tom
  | "MT"  // mid tom
  | "HT"  // high tom
  | "RS"  // rim shot
  | "CP"  // clap
  | "CH"  // closed hat
  | "OH"; // open hat

export type VoiceParams = {
  level: number;     // 0..1
  tune: number;      // -1..+1 (pitch offset from default)
  decay: number;     // 0..1 (decay time)
  // voice-specific extras:
  tone?: number;     // SD: balance of tone vs noise. CP: room reverb amount.
  snappy?: number;   // SD: noise level
};

const DEFAULTS: Record<Voice, VoiceParams> = {
  BD: { level: 1.0, tune: 0,    decay: 0.45 },
  SD: { level: 0.85, tune: 0,   decay: 0.35, tone: 0.5, snappy: 0.5 },
  LT: { level: 0.8,  tune: -0.3, decay: 0.55 },
  MT: { level: 0.8,  tune: 0,   decay: 0.5 },
  HT: { level: 0.8,  tune: 0.3, decay: 0.45 },
  RS: { level: 0.7,  tune: 0,   decay: 0.1 },
  CP: { level: 0.85, tune: 0,   decay: 0.4, tone: 0.3 },
  CH: { level: 0.7,  tune: 0,   decay: 0.08 },
  OH: { level: 0.7,  tune: 0,   decay: 0.4 },
};

export class Engine909 {
  ctx: BaseAudioContext;
  master: GainNode;
  voices: Record<Voice, VoiceParams>;
  private noiseBuffer: AudioBuffer;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ctx.destination);
    this.voices = JSON.parse(JSON.stringify(DEFAULTS));

    // Build a 2-second mono white-noise buffer once. Reused by every
    // noise-based voice so we don't allocate on every trigger.
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 2, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  setParam<K extends keyof VoiceParams>(voice: Voice, key: K, value: VoiceParams[K]) {
    this.voices[voice][key] = value;
  }

  getParams(voice: Voice): VoiceParams {
    return this.voices[voice];
  }

  resetVoice(voice: Voice) {
    this.voices[voice] = JSON.parse(JSON.stringify(DEFAULTS[voice]));
  }

  // Trigger a voice at a specific audio-context time. velocity 0..1.
  trigger(voice: Voice, time: number, velocity = 1) {
    const t = Math.max(time, this.ctx.currentTime);
    const p = this.voices[voice];
    const vel = Math.max(0, Math.min(1, velocity));
    switch (voice) {
      case "BD": return this.kick(t, p, vel);
      case "SD": return this.snare(t, p, vel);
      case "LT":
      case "MT":
      case "HT": return this.tom(voice, t, p, vel);
      case "RS": return this.rim(t, p, vel);
      case "CP": return this.clap(t, p, vel);
      case "CH": return this.hat(t, p, vel, false);
      case "OH": return this.hat(t, p, vel, true);
    }
  }

  // ---- voices ----

  // 909 kick: sine osc with a fast pitch sweep + a tiny click transient.
  private kick(t: number, p: VoiceParams, vel: number) {
    const startHz = 150 + p.tune * 80;       // higher tune = punchier
    const endHz = 45 + p.tune * 20;
    const decay = 0.12 + p.decay * 0.7;      // longer decay = boomier
    const peak = p.level * vel * 1.4;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(startHz, t);
    osc.frequency.exponentialRampToValueAtTime(endHz, t + decay * 0.4);

    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(peak, t + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(amp).connect(this.master);
    osc.start(t);
    osc.stop(t + decay + 0.05);

    // Click transient — short noise burst high-passed
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.playbackRate.value = 1;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2000;
    const clickAmp = this.ctx.createGain();
    clickAmp.gain.setValueAtTime(0.6 * vel, t);
    clickAmp.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    noise.connect(hp).connect(clickAmp).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.03);
  }

  // 909 snare: 2 tone oscillators + noise through a bandpass.
  private snare(t: number, p: VoiceParams, vel: number) {
    const tone = p.tone ?? 0.5;
    const snappy = p.snappy ?? 0.5;
    const decay = 0.08 + p.decay * 0.4;

    const tuneHz1 = 180 + p.tune * 60;
    const tuneHz2 = 330 + p.tune * 100;

    // Tone element
    [tuneHz1, tuneHz2].forEach((hz) => {
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = hz;
      const g = this.ctx.createGain();
      const peak = vel * p.level * tone * 0.55;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + decay * 0.5);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + decay);
    });

    // Noise element
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    bp.Q.value = 0.6;
    const ng = this.ctx.createGain();
    const npeak = vel * p.level * snappy * 0.85;
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(npeak, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.001, t + decay);
    n.connect(bp).connect(ng).connect(this.master);
    n.start(t);
    n.stop(t + decay + 0.05);
  }

  // 909 tom: triangle osc with pitch envelope. Tune controls base pitch.
  private tom(voice: "LT" | "MT" | "HT", t: number, p: VoiceParams, vel: number) {
    const base = voice === "LT" ? 80 : voice === "MT" ? 130 : 200;
    const startHz = base * (1 + p.tune * 0.7) * 1.6;
    const endHz = base * (1 + p.tune * 0.7);
    const decay = 0.15 + p.decay * 0.7;

    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(startHz, t);
    o.frequency.exponentialRampToValueAtTime(endHz, t + decay * 0.4);
    const g = this.ctx.createGain();
    const peak = vel * p.level * 1.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + decay + 0.05);

    // tom transient
    const nz = this.ctx.createBufferSource();
    nz.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25 * vel, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    nz.connect(hp).connect(ng).connect(this.master);
    nz.start(t);
    nz.stop(t + 0.04);
  }

  // 909 rim shot: short pitched click + noise burst.
  private rim(t: number, p: VoiceParams, vel: number) {
    const baseHz = 1700 + p.tune * 600;
    const decay = 0.04 + p.decay * 0.1;

    const o = this.ctx.createOscillator();
    o.type = "square";
    o.frequency.value = baseHz;
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(vel * p.level * 0.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + decay);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + decay + 0.02);

    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = baseHz;
    bp.Q.value = 4;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(vel * p.level * 0.6, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + decay);
    n.connect(bp).connect(ng).connect(this.master);
    n.start(t);
    n.stop(t + decay + 0.02);
  }

  // 909 clap: three short noise bursts followed by a longer decay tail.
  private clap(t: number, p: VoiceParams, vel: number) {
    const decay = 0.15 + p.decay * 0.45;
    const tone = p.tone ?? 0.3;

    // Three quick bursts
    const burstOffsets = [0, 0.01, 0.022];
    burstOffsets.forEach((off) => {
      const n = this.ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1100;
      bp.Q.value = 1.2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vel * p.level * 0.9, t + off);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.025);
      n.connect(bp).connect(g).connect(this.master);
      n.start(t + off);
      n.stop(t + off + 0.05);
    });

    // Long tail
    const tail = this.ctx.createBufferSource();
    tail.buffer = this.noiseBuffer;
    const tbp = this.ctx.createBiquadFilter();
    tbp.type = "bandpass";
    tbp.frequency.value = 1500 + tone * 1500;
    tbp.Q.value = 0.8;
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0, t + 0.025);
    tg.gain.linearRampToValueAtTime(vel * p.level * 0.45, t + 0.03);
    tg.gain.exponentialRampToValueAtTime(0.001, t + decay);
    tail.connect(tbp).connect(tg).connect(this.master);
    tail.start(t + 0.025);
    tail.stop(t + decay + 0.05);
  }

  // 909 hat: bandpass-into-highpass filtered noise. Closed = short, open = long.
  private hat(t: number, p: VoiceParams, vel: number, open: boolean) {
    const decay = open ? 0.12 + p.decay * 0.55 : 0.02 + p.decay * 0.08;
    const baseHz = 8000 + p.tune * 3500;

    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    n.playbackRate.value = 1 + p.tune * 0.2;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = baseHz;
    bp.Q.value = 1.5;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    const peak = vel * p.level * (open ? 0.55 : 0.45);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    n.connect(bp).connect(hp).connect(g).connect(this.master);
    n.start(t);
    n.stop(t + decay + 0.05);
  }
}

// Build a fresh engine on an existing context (re-usable across mounts).
export function createEngine(ctx: BaseAudioContext) {
  return new Engine909(ctx);
}
