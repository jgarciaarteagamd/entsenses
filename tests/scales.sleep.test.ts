// ENT Senses Scales — sleep and oropharynx scoring, including the published cut-offs.
import { describe, expect, it } from "vitest";
import {
  ahiSeverity,
  bmiOf,
  friedmanStage,
  incompleteSleepScales,
  scoreExam,
  scoreSleepStudy,
  scoreVote,
  summarizeSleep,
} from "@/modules/scales/lib/sleep";

describe("BMI", () => {
  it("kg / m², one decimal", () => {
    expect(bmiOf(80, 175)).toBe(26.1);
    expect(bmiOf(130, 170)).toBe(45);
    expect(bmiOf(80, 0)).toBeNull();
    expect(bmiOf(null, 175)).toBeNull();
  });
});

describe("Modified Friedman staging", () => {
  it("stage I: tongue position I–II with tonsils 3–4", () => {
    expect(friedmanStage("I", 3, 28, false)).toBe(1);
    expect(friedmanStage("IIb", 4, 28, false)).toBe(1);
  });
  it("stage II: I–II with tonsils 0–2, or III–IV with tonsils 3–4", () => {
    expect(friedmanStage("IIa", 2, 28, false)).toBe(2);
    expect(friedmanStage("III", 3, 28, false)).toBe(2);
    expect(friedmanStage("IV", 4, 28, false)).toBe(2);
  });
  it("stage III: III–IV with tonsils 0–2", () => {
    expect(friedmanStage("III", 0, 28, false)).toBe(3);
    expect(friedmanStage("IV", 2, 39.9, false)).toBe(3);
  });
  it("stage IV: BMI over 40 or skeletal deformity, whatever the rest", () => {
    expect(friedmanStage("I", 4, 40.1, false)).toBe(4);
    expect(friedmanStage("I", 4, 40, false)).toBe(1);
    expect(friedmanStage("I", 4, 25, true)).toBe(4);
  });
  it("exam: stage only with every input; Brodsky alone is still a valid exam", () => {
    expect(scoreExam({ brodsky: 3 })).toEqual({ brodsky: 3, ftp: null, bmi: null, friedman: null });
    expect(scoreExam({ brodsky: 3, ftp: "I", weightKg: 80, heightCm: 175, craniofacial: false })?.friedman).toBe(1);
    expect(scoreExam({ brodsky: 3, ftp: "I", craniofacial: true })?.friedman).toBe(4);
    expect(scoreExam({ brodsky: 3, ftp: "I", weightKg: 80, heightCm: 175 })?.friedman).toBeNull();
    expect(scoreExam({})).toBeNull();
  });
});

describe("VOTE", () => {
  it("records degree and allowed configuration per level, with compact notation", () => {
    const v = scoreVote({
      velum: { degree: 2, config: "concentric" },
      oropharynx: { degree: 1, config: "lateral" },
      tongue: { degree: 2, config: "ap" },
      epiglottis: { degree: 0, config: "ap" },
    });
    expect(v?.notation).toBe("V2c O1l T2ap E0");
    expect(v?.obstructed).toBe(3);
  });
  it("drops configurations a level does not allow; X counts as recorded", () => {
    const v = scoreVote({ velum: { degree: 1 }, oropharynx: { degree: 2, config: "ap" }, tongue: { degree: "X" }, epiglottis: { degree: 0 } });
    expect(v?.levels.oropharynx.config).toBeNull();
    expect(v?.notation).toBe("V1 O2 TX E0");
    expect(v?.obstructed).toBe(2);
  });
  it("needs every level", () => {
    expect(scoreVote({ velum: { degree: 2 } })).toBeNull();
  });
});

describe("AHI severity (adults)", () => {
  it("< 5 normal, 5–<15 mild, 15–<30 moderate, ≥ 30 severe", () => {
    expect(ahiSeverity(4.9)).toBe("normal");
    expect(ahiSeverity(5)).toBe("mild");
    expect(ahiSeverity(14.9)).toBe("mild");
    expect(ahiSeverity(15)).toBe("moderate");
    expect(ahiSeverity(29.9)).toBe("moderate");
    expect(ahiSeverity(30)).toBe("severe");
  });
  it("study needs the AHI", () => {
    expect(scoreSleepStudy({ ahi: 22, nadirSpo2: 81 })).toEqual({ ahi: 22, severity: "moderate", odi: null, nadirSpo2: 81, ct90: null });
    expect(scoreSleepStudy({ odi: 10 })).toBeNull();
  });
});

describe("pack summary", () => {
  it("summarises included scales and lists the incomplete ones", () => {
    const s = { adenoid: { value: 3 }, study: {} };
    expect(summarizeSleep(s).adenoid).toBe(3);
    expect(incompleteSleepScales(s)).toEqual(["study"]);
  });
});
