// Universal recorder for any lab room. Tap the engine's master GainNode
// via a MediaStreamAudioDestinationNode (added in parallel — doesn't
// disturb the existing connection to ctx.destination), capture with
// MediaRecorder (webm/opus, browser-native), then on stop decode the blob
// back into an AudioBuffer and re-encode as 16-bit PCM WAV so the file is
// Move + KO II ready.

import { bufferToWavBlob } from "./export";

export type RecorderState = "idle" | "recording" | "decoding";

export class Recorder {
  ctx: AudioContext;
  private dest: MediaStreamAudioDestinationNode;
  private mr: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private state: RecorderState = "idle";

  constructor(ctx: AudioContext, source: AudioNode) {
    this.ctx = ctx;
    this.dest = ctx.createMediaStreamDestination();
    // Adding a second .connect() in parallel — the original master →
    // ctx.destination connection still works fine. We get a perfect tap.
    source.connect(this.dest);
  }

  getState() { return this.state; }

  start() {
    if (this.state !== "idle") return;
    this.chunks = [];
    // Try to use the most compatible mime — Chrome/Edge support webm/opus;
    // Safari may need audio/mp4. Fall back to default if neither is named.
    let mime = "";
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        mime = c;
        break;
      }
    }
    this.mr = mime
      ? new MediaRecorder(this.dest.stream, { mimeType: mime })
      : new MediaRecorder(this.dest.stream);
    this.mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
    this.mr.start(100);
    this.state = "recording";
  }

  // Stops recording, decodes the captured audio back into an AudioBuffer,
  // and returns a WAV-encoded Blob ready for download.
  async stopAndExportWav(): Promise<Blob> {
    if (this.state !== "recording" || !this.mr) throw new Error("not recording");
    this.state = "decoding";
    await new Promise<void>((resolve) => {
      this.mr!.onstop = () => resolve();
      try { this.mr!.stop(); } catch { resolve(); }
    });
    const captured = new Blob(this.chunks, { type: this.mr.mimeType || "audio/webm" });
    this.chunks = [];
    this.mr = null;
    const arr = await captured.arrayBuffer();
    // The browser can decode its own captured webm/opus — give it back.
    const buf = await this.ctx.decodeAudioData(arr);
    const wav = bufferToWavBlob(buf);
    this.state = "idle";
    return wav;
  }

  cancel() {
    if (this.state !== "recording" || !this.mr) { this.state = "idle"; return; }
    try { this.mr.stop(); } catch {}
    this.mr = null;
    this.chunks = [];
    this.state = "idle";
  }
}

// Convenience: build + start in one go, but in practice you want to keep
// a Recorder instance around so its tap stays connected.
