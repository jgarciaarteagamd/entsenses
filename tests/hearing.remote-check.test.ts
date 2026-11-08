// ENT Senses Hearing — patient's informative remote check: estimated scale, classification and
// end-to-end runs with virtual patients through the automated procedure.
import { describe, expect, it } from "vitest";
import { HughsonWestlake, mulberry32 } from "../src/modules/hearing/audio/hughsonWestlake";
import type { EarSide } from "../src/modules/hearing/audio/levels";
import {
  REMOTE_MAX_DBFS,
  REMOTE_SEQUENCE,
  REF_DBFS,
  assess,
  estToDbfs,
  estimatedPta,
  questionnaireScore,
  readRemoteAudiogram,
  remoteAudiogramJson,
  remoteMaxLevel,
  thresholdsFromRun,
  type EstThresholds,
} from "../src/modules/hearing/lib/remoteCheck";

function runPatient(th: Record<EarSide, Record<number, number>>, seed = 1, catchAnswer = false) {
  const hw = new HughsonWestlake({
    ears: ["right", "left"],
    frequencies: REMOTE_SEQUENCE,
    sequence: REMOTE_SEQUENCE,
    maxLevel: (_e, f) => remoteMaxLevel(f),
    catchRate: 0.1,
    random: mulberry32(seed),
  });
  for (let i = 0; i < 2000 && !hw.done; i++) {
    const s = hw.next()!;
    hw.record(s.catchTrial ? catchAnswer : s.level >= th[s.ear][s.frequency]);
  }
  expect(hw.done).toBe(true);
  return hw.results;
}

const noFlags = { redFlags: [], answers: {} };

describe("remote check — estimated scale", () => {
  it("maps the comfortable reference to the assumed hearing level at 1 kHz", () => {
    expect(estToDbfs(55, 1000)).toBe(REF_DBFS);
    expect(estToDbfs(0, 1000)).toBe(-80);
    expect(estToDbfs(0, 500)).toBe(-75.5);
  });

  it("never exceeds the digital maximum", () => {
    for (const f of REMOTE_SEQUENCE) {
      expect(estToDbfs(remoteMaxLevel(f), f)).toBeLessThanOrEqual(REMOTE_MAX_DBFS);
      expect(remoteMaxLevel(f) % 5).toBe(0);
    }
    expect(remoteMaxLevel(1000)).toBe(70);
  });

  it("stores estimates apart from calibrated values and reads them back", () => {
    const th: EstThresholds = { right: { 1000: 10, 4000: "nr" }, left: { 1000: 15 } };
    const json = remoteAudiogramJson(th);
    expect(json).not.toHaveProperty("right");
    expect(readRemoteAudiogram(JSON.parse(JSON.stringify(json)))).toEqual(th);
    expect(readRemoteAudiogram({ right: { air: { 1000: 10 } } })).toBeNull();
  });
});

describe("remote check — classification", () => {
  it("normal symmetrical hearing → ok", () => {
    const th = { right: { 500: 10, 1000: 5, 2000: 10, 4000: 15 }, left: { 500: 10, 1000: 10, 2000: 5, 4000: 15 } };
    const r = assess({ thresholds: th, ...noFlags, falsePositiveRate: 0, warnings: [] });
    expect(r.category).toEqual({ right: "good", left: "good" });
    expect(r.asymmetric).toBe(false);
    expect(r.recommendation).toBe("ok");
  });

  it("one-sided loss → asymmetry, worse ear and review", () => {
    const th = { right: { 500: 40, 1000: 45, 2000: 50, 4000: 60 }, left: { 500: 10, 1000: 10, 2000: 15, 4000: 20 } };
    const r = assess({ thresholds: th, ...noFlags, falsePositiveRate: 0, warnings: [] });
    expect(r.category.right).toBe("possible_loss");
    expect(r.category.left).toBe("good");
    expect(r.asymmetric).toBe(true);
    expect(r.worseEar).toBe("right");
    expect(r.recommendation).toBe("review");
  });

  it("an isolated 4 kHz difference of 25 dB counts as asymmetry", () => {
    const th = { right: { 500: 10, 1000: 10, 2000: 10, 4000: 45 }, left: { 500: 10, 1000: 10, 2000: 10, 4000: 20 } };
    expect(assess({ thresholds: th, ...noFlags, falsePositiveRate: 0, warnings: [] }).asymmetric).toBe(true);
  });

  it("no response counts above the maximum", () => {
    expect(estimatedPta({ 500: 70, 1000: "nr", 2000: "nr", 4000: "nr" })).toBeGreaterThan(70);
    expect(estimatedPta({ 500: 10 })).toBeNull();
  });

  it("red flags always give the urgent message", () => {
    const th = { right: { 500: 10, 1000: 10, 2000: 10, 4000: 10 }, left: { 500: 10, 1000: 10, 2000: 10, 4000: 10 } };
    const r = assess({ thresholds: th, answers: {}, redFlags: ["sudden"], falsePositiveRate: 0, warnings: [] });
    expect(r.recommendation).toBe("urgent");
  });

  it("everyday complaints recommend a review even with a normal test", () => {
    const th = { right: { 500: 10, 1000: 10, 2000: 10, 4000: 10 }, left: { 500: 10, 1000: 10, 2000: 10, 4000: 10 } };
    const answers = { selfRating: 2, quiet: 1, noise: 3, phone: 1, tv: 2 } as const;
    expect(questionnaireScore(answers)).toBe(9);
    expect(assess({ thresholds: th, answers, redFlags: [], falsePositiveRate: 0, warnings: [] }).recommendation).toBe("review");
  });

  it("many presses without a tone → repeat", () => {
    const th = { right: { 500: 10, 1000: 10, 2000: 10, 4000: 10 }, left: { 500: 10, 1000: 10, 2000: 10, 4000: 10 } };
    expect(assess({ thresholds: th, ...noFlags, falsePositiveRate: 0.5, warnings: [] }).recommendation).toBe("repeat");
  });
});

describe("remote check — virtual patients end to end", () => {
  it("finds a normal listener's levels and says ok", () => {
    const th: Record<EarSide, Record<number, number>> = { right: { 500: 5, 1000: 0, 2000: 5, 4000: 10 }, left: { 500: 5, 1000: 5, 2000: 0, 4000: 10 } };
    const res = runPatient(th);
    const est = thresholdsFromRun(res);
    for (const ear of ["right", "left"] as const) for (const f of REMOTE_SEQUENCE) expect(est[ear][f]).toBe(th[ear][f]);
    const r = assess({ thresholds: est, ...noFlags, falsePositiveRate: 0, warnings: res.warnings });
    expect(r.recommendation).toBe("ok");
  });

  it("detects a high-frequency loss in one ear", () => {
    const th = { right: { 500: 10, 1000: 15, 2000: 40, 4000: 60 }, left: { 500: 10, 1000: 10, 2000: 15, 4000: 20 } };
    const est = thresholdsFromRun(runPatient(th, 7));
    const r = assess({ thresholds: est, ...noFlags, falsePositiveRate: 0, warnings: [] });
    expect(r.asymmetric).toBe(true);
    expect(r.worseEar).toBe("right");
    expect(r.recommendation).toBe("review");
  });

  it("a patient who hears nothing gets no-response results within the safe maximum", () => {
    const th = { right: { 500: 200, 1000: 200, 2000: 200, 4000: 200 }, left: { 500: 200, 1000: 200, 2000: 200, 4000: 200 } };
    const res = runPatient(th);
    const est = thresholdsFromRun(res);
    expect(est.right[1000]).toBe("nr");
    expect(assess({ thresholds: est, ...noFlags, falsePositiveRate: 0, warnings: [] }).category.right).toBe("probable_loss");
  });

  it("a patient who presses all the time is flagged as unreliable", () => {
    const th = { right: { 500: 10, 1000: 10, 2000: 10, 4000: 10 }, left: { 500: 10, 1000: 10, 2000: 10, 4000: 10 } };
    const res = runPatient(th, 3, true);
    const fpr = res.falsePositives / Math.max(1, res.catchTrials);
    expect(res.catchTrials).toBeGreaterThan(0);
    expect(assess({ thresholds: thresholdsFromRun(res), ...noFlags, falsePositiveRate: fpr, warnings: res.warnings }).unreliable).toBe(true);
  });
});
