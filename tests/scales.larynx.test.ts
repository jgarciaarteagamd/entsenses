// ENT Senses Scales — larynx and swallowing scoring, including the published cut-offs.
import { describe, expect, it } from "vitest";
import {
  RFS_ITEMS,
  incompleteLarynxScales,
  packYearsOf,
  pasClass,
  scoreFees,
  scoreNbi,
  scoreReinke,
  scoreRfs,
  scoreStenosis,
  summarizeLarynx,
  type RfsInput,
} from "@/modules/scales/lib/larynx";

const rfs = (over: RfsInput = {}): RfsInput => ({ ...Object.fromEntries(RFS_ITEMS.map((k) => [k, 0])), ...over });

describe("Reflux Finding Score", () => {
  it("adds the 8 findings, maximum 26", () => {
    expect(scoreRfs(rfs())).toEqual({ total: 0, aboveThreshold: false });
    const max = rfs({ subglotticEdema: 2, ventricularObliteration: 4, erythema: 4, vocalFoldEdema: 4, diffuseEdema: 4, posteriorCommissure: 4, granuloma: 2, mucus: 2 });
    expect(scoreRfs(max)?.total).toBe(26);
  });
  it("flags scores above 7 (7 itself is not above)", () => {
    expect(scoreRfs(rfs({ erythema: 4, vocalFoldEdema: 3 }))).toEqual({ total: 7, aboveThreshold: false });
    expect(scoreRfs(rfs({ erythema: 4, vocalFoldEdema: 4 }))).toEqual({ total: 8, aboveThreshold: true });
  });
  it("rejects values that the item does not allow and missing items", () => {
    expect(scoreRfs(rfs({ subglotticEdema: 1 }))).toBeNull();
    expect(scoreRfs(rfs({ erythema: 3 }))).toBeNull();
    expect(scoreRfs({ erythema: 2 })).toBeNull();
  });
});

describe("Reinke's oedema (Tan)", () => {
  it("takes the highest grade of the two folds", () => {
    expect(scoreReinke({ right: 2, left: 3 })).toEqual({ right: 2, left: 3, max: 3 });
    expect(scoreReinke({ right: 0, left: 1 })?.max).toBe(1);
  });
  it("grade 4 on one fold is enough (the other is not graded)", () => {
    expect(scoreReinke({ right: 4 })).toEqual({ right: 4, left: null, max: 4 });
    expect(scoreReinke({ left: 4, right: 2 })).toEqual({ right: null, left: 4, max: 4 });
  });
  it("is incomplete with one fold missing", () => {
    expect(scoreReinke({ right: 2 })).toBeNull();
  });
});

describe("pack-years", () => {
  it("is cigarettes per day ÷ 20 × years", () => {
    expect(packYearsOf({ cigsPerDay: 20, yearsSmoked: 30 })).toBe(30);
    expect(packYearsOf({ cigsPerDay: 10, yearsSmoked: 15 })).toBe(7.5);
    expect(packYearsOf({ cigsPerDay: 15, yearsSmoked: 7 })).toBe(5.3);
    expect(packYearsOf({ cigsPerDay: 0, yearsSmoked: 20 })).toBe(0);
  });
  it("needs both values, and still reads pack-years typed in older rows", () => {
    expect(packYearsOf({ cigsPerDay: 20 })).toBeNull();
    expect(packYearsOf({ packYears: 25 })).toBe(25);
    expect(summarizeLarynx({ reinke: { right: 1, left: 1, cigsPerDay: 40, yearsSmoked: 10 } }).packYears).toBe(20);
  });
});

describe("NBI (Ni / ELS)", () => {
  it("keeps the descriptive categories chosen", () => {
    expect(scoreNbi({ ni: "IV" })).toEqual({ ni: "IV", els: null });
    expect(scoreNbi({ els: "perpendicular", ni: "Vb" })).toEqual({ ni: "Vb", els: "perpendicular" });
    expect(scoreNbi({ site: "rightFold" })).toBeNull();
    expect(scoreNbi({ ni: "VI" as never })).toBeNull();
  });
});

describe("Myer-Cotton", () => {
  it("grades by percentage of obstruction at the published limits", () => {
    expect(scoreStenosis({ obstructionPct: 50 })?.grade).toBe(1);
    expect(scoreStenosis({ obstructionPct: 51 })?.grade).toBe(2);
    expect(scoreStenosis({ obstructionPct: 70 })?.grade).toBe(2);
    expect(scoreStenosis({ obstructionPct: 71 })?.grade).toBe(3);
    expect(scoreStenosis({ obstructionPct: 99 })?.grade).toBe(3);
    expect(scoreStenosis({ obstructionPct: 100 })?.grade).toBe(4);
    expect(scoreStenosis({ noLumen: true })).toEqual({ grade: 4, pct: 100 });
    expect(scoreStenosis({ obstructionPct: 120 })).toBeNull();
    expect(scoreStenosis({})).toBeNull();
  });
});

describe("FEES", () => {
  it("penetration is PAS 2–5 and aspiration 6–8", () => {
    expect(pasClass(1)).toBe("none");
    expect(pasClass(2)).toBe("penetration");
    expect(pasClass(5)).toBe("penetration");
    expect(pasClass(6)).toBe("aspiration");
    expect(pasClass(8)).toBe("aspiration");
  });
  it("keeps the worst PAS and Yale scores across consistencies", () => {
    const s = scoreFees({ thin: { pas: 7, yaleV: 2, yaleP: 3 }, puree: { pas: 2, yaleV: 4 }, solid: {} });
    expect(s).toEqual({ pas: 7, pasClass: "aspiration", pasConsistency: "thin", yaleV: 4, yaleP: 3 });
  });
  it("is incomplete when nothing was scored", () => {
    expect(scoreFees({ thin: {} })).toBeNull();
    expect(scoreFees({ thin: { pas: 9 } })).toBeNull();
  });
});

describe("pack summary", () => {
  it("summarises included scales, pack-years and the Voice snapshot", () => {
    const scales = {
      reinke: { right: 3, left: 2, packYears: 30 },
      voice: { avqi: 5.2, cpps: 9.1, f0: 118, grbasG: 2, date: "2026-11-01T10:00:00Z" },
      secretions: { value: 1 },
      fois: { value: 9 },
    };
    const s = summarizeLarynx(scales);
    expect(s.reinke?.max).toBe(3);
    expect(s.packYears).toBe(30);
    expect(s.voice?.avqi).toBe(5.2);
    expect(s.secretions).toBe(1);
    expect(s.fois).toBeNull();
    expect(incompleteLarynxScales(scales)).toEqual(["fois"]);
    expect(incompleteLarynxScales({ voice: {} })).toEqual(["voice"]);
  });
});
