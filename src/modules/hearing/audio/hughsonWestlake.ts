// ENT Senses Hearing — automated pure-tone threshold procedure (modified Hughson-Westlake,
// ascending method of ISO 8253-1). Pure logic, no audio: the audiometer asks `next()` what to
// present and reports the patient's answer with `record()`. Unit-tested with virtual patients.
//
// Per frequency:
//   1. Initial run from the start level: while the patient responds, go down 10 dB; while they
//      do not, go up 10 dB. The first change of answer starts the bracketing.
//   2. Bracketing: after a response −10 dB, after no response +5 dB. A presentation that follows
//      a "no response" is ASCENDING.
//   3. Threshold = lowest level with 2 responses on ascending presentations (≥ 2 of up to 3–4).
//   4. Limits: no response twice at the maximum → "no response"; responses at −10 dB twice →
//      threshold −10 dB; more than MAX_PRESENTATIONS → best estimate, flagged as unreliable.
// Order per ear: 1, 2, 4, 8 kHz, 1 kHz retest, 500, 250, 125 Hz; the inter-octave frequency
// (750, 1500, 3000, 6000 Hz) is added when the two octave thresholds differ by ≥ 20 dB.
// Catch trials (silence) are interleaved at random to detect false responses.
import { HL_MIN, type EarSide } from "./levels";

export type AutoThreshold = { level: number; unreliable?: boolean } | { noResponse: true };

export interface AutoStep {
  ear: EarSide;
  frequency: number;
  level: number;
  /** Silent catch trial: nothing is played; a response is a false positive. */
  catchTrial: boolean;
  retest: boolean;
}

export interface AutoOptions {
  ears: EarSide[];
  /** Frequencies available (calibrated) for both ears. */
  frequencies: number[];
  /** Maximum presentable level for an ear/frequency (null = not calibrated). */
  maxLevel: (ear: EarSide, frequency: number) => number | null;
  /** Probability of inserting a catch trial before a real presentation (0 = none). */
  catchRate?: number;
  /** Random number generator in [0, 1) (seedable for tests). */
  random?: () => number;
  firstStartLevel?: number;
  /**
   * Explicit frequency order (e.g. biological calibration): every listed frequency is tested,
   * without the 1 kHz retest or automatic inter-octaves.
   */
  sequence?: number[];
}

export interface AutoResults {
  thresholds: Record<EarSide, Partial<Record<number, AutoThreshold>>>;
  retest: Partial<Record<EarSide, number>>;
  presentations: number;
  catchTrials: number;
  falsePositives: number;
  warnings: string[];
}

const MAX_PRESENTATIONS = 40;
const OCTAVE_ORDER: (number | "1000r")[] = [1000, 2000, 4000, 8000, "1000r", 500, 250, 125];
const INTER_OCTAVE: [number, number, number][] = [
  [500, 750, 1000],
  [1000, 1500, 2000],
  [2000, 3000, 4000],
  [4000, 6000, 8000],
];

interface Search {
  ear: EarSide;
  frequency: number;
  retest: boolean;
  max: number;
  level: number;
  bracketing: boolean;
  lastResponse: boolean | null;
  firstAnswer: boolean | null;
  asc: Map<number, { trials: number; responses: number }>;
  presentations: number;
  noResponseAtMax: number;
  responsesAtMin: number;
}

export class HughsonWestlake {
  private opts: Required<Omit<AutoOptions, "random" | "catchRate" | "firstStartLevel" | "sequence">> & {
    sequence?: number[];
    random: () => number;
    catchRate: number;
    firstStartLevel: number;
  };
  private queue: { ear: EarSide; frequency: number; retest: boolean }[] = [];
  private search: Search | null = null;
  private pendingCatch = false;
  private lastWasCatch = false;
  readonly results: AutoResults = {
    thresholds: { right: {}, left: {} },
    retest: {},
    presentations: 0,
    catchTrials: 0,
    falsePositives: 0,
    warnings: [],
  };

  constructor(options: AutoOptions) {
    this.opts = {
      ...options,
      random: options.random ?? Math.random,
      catchRate: options.catchRate ?? 0.1,
      firstStartLevel: options.firstStartLevel ?? 40,
    };
    for (const ear of options.ears) {
      if (options.sequence) {
        for (const f of options.sequence) {
          if (options.maxLevel(ear, f) !== null) this.queue.push({ ear, frequency: f, retest: false });
        }
        continue;
      }
      for (const f of OCTAVE_ORDER) {
        const freq = f === "1000r" ? 1000 : f;
        if (!options.frequencies.includes(freq) || options.maxLevel(ear, freq) === null) continue;
        this.queue.push({ ear, frequency: freq, retest: f === "1000r" });
      }
    }
    this.startNext();
  }

  get done(): boolean {
    return this.search === null;
  }

  /** What to present now (null when the procedure has finished). */
  next(): AutoStep | null {
    const s = this.search;
    if (!s) return null;
    if (!this.pendingCatch && !this.lastWasCatch && this.opts.catchRate > 0 && this.opts.random() < this.opts.catchRate) {
      this.pendingCatch = true;
    }
    return { ear: s.ear, frequency: s.frequency, level: s.level, catchTrial: this.pendingCatch, retest: s.retest };
  }

  /** Reports whether the patient responded to the step returned by next(). */
  record(responded: boolean): void {
    const s = this.search;
    if (!s) return;
    this.results.presentations += 1;
    if (this.pendingCatch) {
      this.pendingCatch = false;
      this.lastWasCatch = true;
      this.results.catchTrials += 1;
      if (responded) this.results.falsePositives += 1;
      return;
    }
    this.lastWasCatch = false;
    s.presentations += 1;
    const ascending = s.bracketing && s.lastResponse === false;

    if (ascending || (s.bracketing && s.level === HL_MIN && s.lastResponse === true)) {
      const a = s.asc.get(s.level) ?? { trials: 0, responses: 0 };
      a.trials += 1;
      if (responded) a.responses += 1;
      s.asc.set(s.level, a);
      if (responded && a.responses >= 2) return this.finish({ level: s.level });
    }

    // Limits
    if (!responded && s.level >= s.max) {
      s.noResponseAtMax += 1;
      if (s.noResponseAtMax >= 2) return this.finish({ noResponse: true });
    }
    if (responded && s.level <= HL_MIN) {
      s.responsesAtMin += 1;
      if (s.responsesAtMin >= 2) return this.finish({ level: HL_MIN });
    }
    if (s.presentations >= MAX_PRESENTATIONS) return this.finish(this.bestEstimate(s));

    // Next level
    if (!s.bracketing) {
      if (s.firstAnswer === null) s.firstAnswer = responded;
      if (responded !== s.firstAnswer) s.bracketing = true;
    }
    if (s.bracketing) s.level += responded ? -10 : 5;
    else s.level += responded ? -10 : 10;
    s.level = Math.max(HL_MIN, Math.min(s.max, s.level));
    s.lastResponse = responded;
  }

  private bestEstimate(s: Search): AutoThreshold {
    const levels = [...s.asc.entries()].filter(([, a]) => a.responses * 2 >= a.trials && a.responses > 0).map(([l]) => l);
    if (!levels.length) return { noResponse: true };
    return { level: Math.min(...levels), unreliable: true };
  }

  private finish(t: AutoThreshold): void {
    const s = this.search!;
    const tag = `${s.ear}_${s.frequency}`;
    if (s.retest) {
      if ("level" in t) {
        this.results.retest[s.ear] = t.level;
        const first = this.results.thresholds[s.ear][1000];
        if (first && "level" in first && Math.abs(first.level - t.level) > 10) this.results.warnings.push(`retest_${s.ear}`);
      }
    } else {
      this.results.thresholds[s.ear][s.frequency] = t;
      if ("level" in t && t.unreliable) this.results.warnings.push(`unreliable_${tag}`);
      if (!this.opts.sequence) this.addInterOctaves(s.ear);
    }
    this.startNext();
  }

  private addInterOctaves(ear: EarSide): void {
    const th = this.results.thresholds[ear];
    for (const [lo, mid, hi] of INTER_OCTAVE) {
      const a = th[lo];
      const b = th[hi];
      if (!a || !b || !("level" in a) || !("level" in b)) continue;
      if (Math.abs(a.level - b.level) < 20) continue;
      if (th[mid] || !this.opts.frequencies.includes(mid) || this.opts.maxLevel(ear, mid) === null) continue;
      if (this.queue.some((q) => q.ear === ear && q.frequency === mid)) continue;
      this.queue.unshift({ ear, frequency: mid, retest: false });
    }
  }

  /** Threshold already found at the nearest frequency (log scale) of the same ear. */
  private nearestThreshold(ear: EarSide, frequency: number): number | undefined {
    let best: { d: number; level: number } | undefined;
    for (const [f, t] of Object.entries(this.results.thresholds[ear])) {
      if (!t || !("level" in t)) continue;
      const d = Math.abs(Math.log2(Number(f) / frequency));
      if (!best || d < best.d) best = { d, level: t.level };
    }
    return best?.level;
  }

  private startNext(): void {
    const item = this.queue.shift();
    if (!item) {
      this.search = null;
      if (this.results.catchTrials >= 3 && this.results.falsePositives / this.results.catchTrials > 0.3) {
        this.results.warnings.push("false_positives_high");
      }
      return;
    }
    const max = this.opts.maxLevel(item.ear, item.frequency)!;
    const prev = this.nearestThreshold(item.ear, item.frequency);
    const start = item.retest || prev === undefined ? this.opts.firstStartLevel : prev + 10;
    this.search = {
      ...item,
      max,
      level: Math.max(HL_MIN + 10, Math.min(max, start)),
      bracketing: false,
      lastResponse: null,
      firstAnswer: null,
      asc: new Map(),
      presentations: 0,
      noResponseAtMax: 0,
      responsesAtMin: 0,
    };
  }
}

/** Seedable RNG (for tests and reproducible simulations). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
