// ENT Senses Hearing — automated procedure (modified Hughson-Westlake) tested with virtual patients.
import { describe, expect, it } from "vitest";
import { HughsonWestlake, mulberry32, type AutoResults } from "../src/modules/hearing/audio/hughsonWestlake";
import type { EarSide } from "../src/modules/hearing/audio/levels";

const FREQS = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];

type Patient = (ear: EarSide, f: number, level: number) => boolean;

function run(patient: Patient, opts: { catchRate?: number; seed?: number; max?: number; catchAnswer?: boolean } = {}): AutoResults {
  const hw = new HughsonWestlake({
    ears: ["right", "left"],
    frequencies: FREQS,
    maxLevel: () => opts.max ?? 90,
    catchRate: opts.catchRate ?? 0,
    random: mulberry32(opts.seed ?? 1),
  });
  for (let i = 0; i < 5000 && !hw.done; i++) {
    const step = hw.next()!;
    hw.record(step.catchTrial ? Boolean(opts.catchAnswer) : patient(step.ear, step.frequency, step.level));
  }
  expect(hw.done).toBe(true);
  return hw.results;
}

/** Ideal patient: always hears at or above the threshold, never below. */
const ideal = (th: Record<EarSide, Record<number, number>>): Patient => (ear, f, level) => level >= (th[ear][f] ?? 999);

describe("automated Hughson-Westlake", () => {
  const TH: Record<EarSide, Record<number, number>> = {
    right: { 125: 15, 250: 15, 500: 20, 750: 20, 1000: 25, 1500: 35, 2000: 50, 3000: 55, 4000: 60, 6000: 65, 8000: 70 },
    left: { 125: 10, 250: 10, 500: 10, 750: 10, 1000: 5, 1500: 5, 2000: 10, 3000: 15, 4000: 20, 6000: 25, 8000: 30 },
  };

  it("finds the exact threshold of an ideal patient at every tested frequency, both ears", () => {
    const r = run(ideal(TH));
    for (const ear of ["right", "left"] as const) {
      for (const [f, t] of Object.entries(r.thresholds[ear])) {
        expect(t).toEqual({ level: TH[ear][Number(f)] });
      }
      expect(r.retest[ear]).toBe(TH[ear][1000]);
    }
    expect(r.warnings).toEqual([]);
  });

  it("tests octaves and adds the inter-octave only when octaves differ by ≥ 20 dB", () => {
    const r = run(ideal(TH));
    // right: 1000 (25) → 2000 (50): 25 dB → 1500 added; 2000→4000: 10 → no 3000
    expect(Object.keys(r.thresholds.right).map(Number).sort((a, b) => a - b)).toEqual([125, 250, 500, 1000, 1500, 2000, 4000, 8000]);
    // left: all octave differences < 20 → no inter-octaves
    expect(Object.keys(r.thresholds.left).map(Number).sort((a, b) => a - b)).toEqual([125, 250, 500, 1000, 2000, 4000, 8000]);
  });

  it("records no response when the patient does not hear the maximum level", () => {
    const deaf8k = ideal({ ...TH, right: { ...TH.right, 8000: 120 } });
    const r = run(deaf8k);
    expect(r.thresholds.right[8000]).toEqual({ noResponse: true });
  });

  it("stops at −10 dB HL for very good hearing", () => {
    const r = run(() => true, { catchRate: 0 });
    expect(r.thresholds.left[1000]).toEqual({ level: -10 });
  });

  it("detects false responses with catch trials", () => {
    const r = run(ideal(TH), { catchRate: 0.15, seed: 7, catchAnswer: true });
    expect(r.catchTrials).toBeGreaterThan(5);
    expect(r.falsePositives).toBe(r.catchTrials);
    expect(r.warnings).toContain("false_positives_high");
    const honest = run(ideal(TH), { catchRate: 0.15, seed: 7, catchAnswer: false });
    expect(honest.falsePositives).toBe(0);
    expect(honest.warnings).not.toContain("false_positives_high");
  });

  it("is accurate with a realistic (probabilistic) listener: |error| ≤ 5 dB in ≥ 90 % and small bias", () => {
    // Psychometric function: P(yes) = 1 / (1 + exp(−(level − T) / 2)), plus 2 % lapses/guesses.
    // Reference: the lowest 5-dB level heard at least half of the time, ceil(T / 5) × 5 (thresholds
    // are reported on the 5-dB grid, so a continuous T is always rounded up by up to 5 dB).
    const errors: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const rnd = mulberry32(1000 + seed);
      const T: Record<EarSide, Record<number, number>> = {
        right: Object.fromEntries(FREQS.map((f) => [f, Math.round(rnd() * 60)])),
        left: Object.fromEntries(FREQS.map((f) => [f, Math.round(rnd() * 60)])),
      };
      const listener: Patient = (ear, f, level) => {
        if (rnd() < 0.02) return rnd() < 0.5;
        return rnd() < 1 / (1 + Math.exp(-(level - T[ear][f]) / 2));
      };
      const r = run(listener, { seed });
      for (const ear of ["right", "left"] as const) {
        for (const [f, t] of Object.entries(r.thresholds[ear])) {
          if (t && "level" in t) errors.push(t.level - Math.ceil(T[ear][Number(f)] / 5) * 5);
        }
      }
    }
    const within = errors.filter((e) => Math.abs(e) <= 5).length / errors.length;
    const bias = errors.reduce((a, b) => a + b, 0) / errors.length;
    expect(errors.length).toBeGreaterThan(500);
    expect(within).toBeGreaterThanOrEqual(0.9);
    expect(Math.abs(bias)).toBeLessThanOrEqual(2.5);
  });

  it("uses a reasonable number of presentations", () => {
    const r = run(ideal(TH));
    expect(r.presentations).toBeLessThan(250);
  });
});

describe("explicit sequence (biological calibration)", () => {
  it("tests every listed frequency once per ear, no retest or inter-octaves", () => {
    const seq = [1000, 2000, 3000, 4000, 6000, 8000, 750, 500, 250, 125, 1500];
    const hw = new HughsonWestlake({ ears: ["right", "left"], frequencies: FREQS, maxLevel: () => 100, catchRate: 0, sequence: seq });
    while (!hw.done) {
      const s = hw.next()!;
      hw.record(s.level >= 30);
    }
    expect(Object.keys(hw.results.thresholds.right).length).toBe(11);
    expect(Object.values(hw.results.thresholds.left).every((t) => t && "level" in t && t.level === 30)).toBe(true);
    expect(hw.results.retest).toEqual({});
  });
});
