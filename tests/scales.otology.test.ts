// ENT Senses Scales — otology scoring, including the published cut-offs.
import { describe, expect, it } from "vitest";
import {
  SB_EXPRESSIONS,
  incompleteOtologyScales,
  meniereStage,
  pta4,
  scoreBarany,
  scoreCholesteatoma,
  scoreHouseBrackmann,
  scoreKoos,
  scoreMeniere,
  scoreRetraction,
  scoreSunnybrook,
  summarizeOtology,
  thresholdsFromAudiogram,
  type MeniereInput,
  type SunnybrookInput,
} from "@/modules/scales/lib/otology";

const all = (v: number) => Object.fromEntries(SB_EXPRESSIONS.map((e) => [e, v]));

describe("House-Brackmann and Koos", () => {
  it("accept only their grade ranges", () => {
    expect(scoreHouseBrackmann({ side: "left", grade: 3 })).toEqual({ grade: 3, side: "left" });
    expect(scoreHouseBrackmann({ grade: 7 })).toBeNull();
    expect(scoreKoos({ grade: 4, side: "right" })).toEqual({ grade: 4, side: "right" });
    expect(scoreKoos({ grade: 5 })).toBeNull();
  });
});

describe("Sunnybrook", () => {
  const normal: SunnybrookInput = { eye: "normal", cheek: "normal", mouth: "normal", voluntary: all(5), synkinesis: all(0) };
  it("a normal face scores 100", () => {
    expect(scoreSunnybrook(normal)).toEqual({ resting: 0, voluntary: 100, synkinesis: 0, composite: 100 });
  });
  it("composite = voluntary×4 − resting×5 − synkinesis", () => {
    const s = scoreSunnybrook({ eye: "narrow", cheek: "absent", mouth: "drooped", voluntary: all(3), synkinesis: all(1) });
    // resting (1+2+1)×5 = 20, voluntary 15×4 = 60, synkinesis 5 → 35
    expect(s).toEqual({ resting: 20, voluntary: 60, synkinesis: 5, composite: 35 });
  });
  it("total paralysis with full resting asymmetry scores 0", () => {
    expect(scoreSunnybrook({ eye: "wide", cheek: "absent", mouth: "drooped", voluntary: all(1), synkinesis: all(0) })?.composite).toBe(0);
  });
  it("needs every item", () => {
    expect(scoreSunnybrook({ ...normal, voluntary: { brow: 5 } })).toBeNull();
    expect(scoreSunnybrook({ ...normal, cheek: null })).toBeNull();
  });
});

describe("Sadé / Tos", () => {
  it("keeps the grades chosen per ear", () => {
    expect(scoreRetraction({ right: { sade: 3 }, left: { tos: 2 } })).toEqual({ right: { sade: 3, tos: null }, left: { sade: null, tos: 2 } });
    expect(scoreRetraction({ right: {} })).toBeNull();
  });
});

describe("Ménière", () => {
  it("4-tone average of 0.5, 1, 2 and 3 kHz", () => {
    expect(pta4({ 500: 40, 1000: 45, 2000: 35, 3000: 30 })).toBe(37.5);
    expect(pta4({ 500: 40, 1000: 45, 2000: 35 })).toBeNull();
  });
  it("AAO-HNS 1995 stage limits", () => {
    expect(meniereStage(25)).toBe(1);
    expect(meniereStage(26)).toBe(2);
    expect(meniereStage(40)).toBe(2);
    expect(meniereStage(41)).toBe(3);
    expect(meniereStage(70)).toBe(3);
    expect(meniereStage(71)).toBe(4);
  });
  const definite: MeniereInput = { episodes: true, symptom: "vertigo", duration: "20m-12h", snhl: true, fluctuating: true, notBetterAccounted: true };
  it("Bárány 2015: definite, probable and not met", () => {
    expect(scoreBarany(definite)).toBe("definite");
    expect(scoreBarany({ ...definite, snhl: false })).toBe("probable");
    expect(scoreBarany({ ...definite, duration: "12h-24h" })).toBe("probable");
    expect(scoreBarany({ ...definite, symptom: "dizziness" })).toBe("probable");
    expect(scoreBarany({ ...definite, duration: "other" })).toBe("not_met");
    expect(scoreBarany({ ...definite, fluctuating: false })).toBe("not_met");
    expect(scoreBarany({ episodes: true })).toBeNull();
  });
  it("is complete with the stage or with the criteria", () => {
    expect(scoreMeniere({ thresholds: { 500: 60, 1000: 55, 2000: 50, 3000: 45 } })).toEqual({ pta: 52.5, stage: 3, barany: null });
    expect(scoreMeniere(definite)?.barany).toBe("definite");
    expect(scoreMeniere({ ear: "left" })).toBeNull();
  });
  it("reads the 4 thresholds from a Hearing audiogram, preferring masked values", () => {
    const audiogram = {
      left: { air: { 500: 50, 1000: 55, 2000: 40, 3000: 45, 4000: 60 }, airMasked: { 1000: 60 } },
      right: { air: { 500: 10, 1000: 15 }, noResponse: { air: { 2000: true } } },
    };
    expect(thresholdsFromAudiogram(audiogram, "left")).toEqual({ thresholds: { 500: 50, 1000: 60, 2000: 40, 3000: 45 }, missing: [], noResponse: [] });
    expect(thresholdsFromAudiogram(audiogram, "right")).toEqual({ thresholds: { 500: 10, 1000: 15 }, missing: [3000], noResponse: [2000] });
    expect(thresholdsFromAudiogram(null, "right").missing).toHaveLength(4);
  });
});

describe("EAONO/JOS cholesteatoma", () => {
  const base = { extracranial: false, intracranial: false };
  it("stage I: one site; II: two or more", () => {
    expect(scoreCholesteatoma({ ...base, sites: { A: true } })).toEqual({ stage: 1, sites: ["A"] });
    expect(scoreCholesteatoma({ ...base, sites: { A: true, M: true, S1: true } })).toEqual({ stage: 2, sites: ["S1", "A", "M"] });
  });
  it("complications take precedence: III extracranial, IV intracranial", () => {
    expect(scoreCholesteatoma({ ...base, extracranial: true, sites: { A: true } })?.stage).toBe(3);
    expect(scoreCholesteatoma({ extracranial: true, intracranial: true, sites: { A: true } })?.stage).toBe(4);
  });
  it("needs the complication questions and at least one site", () => {
    expect(scoreCholesteatoma({ sites: { A: true } })).toBeNull();
    expect(scoreCholesteatoma({ ...base })).toBeNull();
  });
});

describe("pack summary", () => {
  it("summarises included scales and lists the incomplete ones", () => {
    const s = { houseBrackmann: { grade: 2, side: "right" as const }, koos: {} };
    expect(summarizeOtology(s).houseBrackmann?.grade).toBe(2);
    expect(incompleteOtologyScales(s)).toEqual(["koos"]);
  });
});
