// ENT Senses Hearing — pure-tone generator (Web Audio).
//
// One sine oscillator routed to ONE channel (left = 0, right = 1) through a gain envelope with
// 25 ms linear rise/fall (no clicks or spectral splatter). Modes: pulsed (3 × 225 ms on/off),
// continuous (1.5 s), warble (±5 % FM at 5 Hz), and an open-ended reference tone for calibration.
// Amplitude 1.0 = 0 dBFS (sine peak). The level is always clamped to the profile's maximum.
import { dbfsToGain, type EarSide } from "./levels";

export type ToneMode = "pulsed" | "continuous" | "warble";
const RAMP = 0.025;

export interface ToneRequest {
  frequency: number;
  ear: EarSide;
  dbfs: number;
  maxDbfs: number;
  mode: ToneMode;
}

/** Writes the on/off envelope of a presentation; returns its end time. */
function scheduleEnvelope(g: AudioParam, t0: number, amp: number, mode: ToneMode): number {
  if (mode === "pulsed") {
    const on = 0.225;
    let t = t0;
    for (let i = 0; i < 3; i++) {
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(amp, t + RAMP);
      g.setValueAtTime(amp, t + on - RAMP);
      g.linearRampToValueAtTime(0, t + on);
      t += on * 2;
    }
    return t;
  }
  const dur = 1.5;
  g.setValueAtTime(0, t0);
  g.linearRampToValueAtTime(amp, t0 + RAMP);
  g.setValueAtTime(amp, t0 + dur - RAMP);
  g.linearRampToValueAtTime(0, t0 + dur);
  return t0 + dur;
}

export class ToneEngine {
  /**
   * Renders a presentation without playing it (OfflineAudioContext), with exactly the same graph
   * and envelope. Used to verify routing, level, frequency and ramps.
   */
  static async renderOffline(req: ToneRequest, sampleRate = 48000): Promise<{ left: Float32Array; right: Float32Array; sampleRate: number }> {
    const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * 1.8), sampleRate);
    const engine = new ToneEngine();
    const { env, nodes } = engine.build(ctx, req);
    scheduleEnvelope(env.gain, 0.02, dbfsToGain(Math.min(req.dbfs, req.maxDbfs)), req.mode);
    nodes.forEach((n) => n.start(0.02));
    const buf = await ctx.startRendering();
    return { left: buf.getChannelData(0), right: buf.getChannelData(1), sampleRate };
  }

  private ctx: AudioContext | null = null;
  private active: { stop: () => void } | null = null;

  async context(): Promise<AudioContext> {
    if (!this.ctx) {
      // iOS 17+: play through the headphones even with the silent switch on.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = "playback";
      this.ctx = new AudioContext({ latencyHint: "interactive" });
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  get sampleRate(): number | null {
    return this.ctx?.sampleRate ?? null;
  }

  private build(ctx: BaseAudioContext, req: Pick<ToneRequest, "frequency" | "mode"> & { ear: EarSide | "both" }) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = req.frequency;
    let lfo: OscillatorNode | null = null;
    if (req.mode === "warble") {
      lfo = ctx.createOscillator();
      lfo.frequency.value = 5;
      const depth = ctx.createGain();
      depth.gain.value = req.frequency * 0.05;
      lfo.connect(depth).connect(osc.frequency);
    }
    const env = ctx.createGain();
    env.gain.value = 0;
    const merger = ctx.createChannelMerger(2);
    osc.connect(env);
    if (req.ear !== "right") env.connect(merger, 0, 0);
    if (req.ear !== "left") env.connect(merger, 0, 1);
    merger.connect(ctx.destination);
    const nodes = [osc, lfo].filter(Boolean) as OscillatorNode[];
    const dispose = () => {
      try {
        nodes.forEach((n) => n.stop());
      } catch {
        // already stopped
      }
      merger.disconnect();
    };
    return { osc, lfo, env, nodes, dispose };
  }

  /** Presents a tone; resolves when it has finished (or was stopped). */
  async present(req: ToneRequest): Promise<void> {
    this.stop();
    const ctx = await this.context();
    const amp = dbfsToGain(Math.min(req.dbfs, req.maxDbfs));
    const { env, nodes, dispose } = this.build(ctx, req);
    const t0 = ctx.currentTime + 0.02;
    const g = env.gain;
    const end = scheduleEnvelope(g, t0, amp, req.mode);
    nodes.forEach((n) => n.start(t0));
    return new Promise((resolve) => {
      const timer = setTimeout(finish, (end - ctx.currentTime) * 1000 + 30);
      const self = this;
      function finish() {
        clearTimeout(timer);
        dispose();
        if (self.active?.stop === stop) self.active = null;
        resolve();
      }
      function stop() {
        const now = ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + RAMP);
        setTimeout(finish, RAMP * 1000 + 10);
      }
      this.active = { stop };
    });
  }

  /** Continuous reference tone for calibration measurements; runs until stop(). */
  async startReference(req: Omit<ToneRequest, "mode" | "ear"> & { ear: EarSide | "both" }): Promise<void> {
    this.stop();
    const ctx = await this.context();
    const amp = dbfsToGain(Math.min(req.dbfs, req.maxDbfs));
    const { env, nodes, dispose } = this.build(ctx, { ...req, mode: "continuous" });
    const t0 = ctx.currentTime + 0.02;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(amp, t0 + RAMP);
    nodes.forEach((n) => n.start(t0));
    this.active = {
      stop: () => {
        const now = ctx.currentTime;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(env.gain.value, now);
        env.gain.linearRampToValueAtTime(0, now + RAMP);
        setTimeout(dispose, RAMP * 1000 + 10);
      },
    };
  }

  stop() {
    const a = this.active;
    this.active = null;
    a?.stop();
  }

  get playing(): boolean {
    return this.active !== null;
  }
}
