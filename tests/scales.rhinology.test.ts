// ENT Senses Scales — rhinology scoring, including the exact thresholds of the published rules.
import { describe, expect, it } from "vitest";
import {
  incompleteScales,
  scoreBiologic,
  scoreControl,
  scoreLundKennedy,
  scoreLundMackay,
  scoreModifiedLundKennedy,
  scoreNps,
  scoreResponse,
  summarizeRhinology,
  type BiologicInput,
  type LkInput,
  type LmInput,
} from "@/modules/scales/lib/rhinology";

describe("Nasal Polyp Score", () => {
  it("adds both sides (0–8)", () => {
    expect(scoreNps({ right: 0, left: 0 })).toEqual({ right: 0, left: 0, total: 0 });
    expect(scoreNps({ right: 4, left: 3 })).toEqual({ right: 4, left: 3, total: 7 });
  });
  it("is incomplete with a missing side or an invalid grade", () => {
    expect(scoreNps({ right: 2 })).toBeNull();
    expect(scoreNps({ right: 5, left: 1 })).toBeNull();
    expect(scoreNps({ right: 1.5, left: 1 })).toBeNull();
    expect(scoreNps(undefined)).toBeNull();
  });
});

const lkSide = (p: number, e: number, d: number, s?: number, c?: number) => ({ polyps: p, edema: e, discharge: d, scarring: s, crusting: c });

describe("Lund-Kennedy", () => {
  it("original sums the five items (max 20) and the modified one three (max 12)", () => {
    const max: LkInput = { right: lkSide(2, 2, 2, 2, 2), left: lkSide(2, 2, 2, 2, 2) };
    expect(scoreLundKennedy(max)?.total).toBe(20);
    expect(scoreModifiedLundKennedy(max)?.total).toBe(12);
    const mixed: LkInput = { right: lkSide(1, 1, 0, 0, 1), left: lkSide(2, 0, 2, 1, 0) };
    expect(scoreLundKennedy(mixed)).toEqual({ right: 3, left: 5, total: 8 });
    expect(scoreModifiedLundKennedy(mixed)).toEqual({ right: 2, left: 4, total: 6 });
  });
  it("modified works without scarring and crusting; original does not", () => {
    const noPostop: LkInput = { right: lkSide(1, 1, 1), left: lkSide(0, 1, 0) };
    expect(scoreModifiedLundKennedy(noPostop)?.total).toBe(4);
    expect(scoreLundKennedy(noPostop)).toBeNull();
  });
});

describe("Lund-Mackay", () => {
  const side = (v: number, omc: number) => ({ maxillary: v, anteriorEthmoid: v, posteriorEthmoid: v, sphenoid: v, frontal: v, omc });
  it("sums five sinuses and the ostiomeatal complex (max 24)", () => {
    const all: LmInput = { right: side(2, 2), left: side(2, 2) };
    expect(scoreLundMackay(all)).toEqual({ right: 12, left: 12, total: 24 });
    expect(scoreLundMackay({ right: side(0, 0), left: side(1, 2) })?.total).toBe(7);
  });
  it("only accepts 0 or 2 for the ostiomeatal complex", () => {
    expect(scoreLundMackay({ right: side(1, 1), left: side(1, 0) })).toBeNull();
  });
});

describe("EPOS 2020 control", () => {
  const all = (v: boolean) => ({ blockage: v, discharge: v, facialPain: v, smell: v, sleep: v, endoscopy: v, rescue: v });
  it("controlled with none present, partly with 1–2, uncontrolled with ≥3", () => {
    expect(scoreControl(all(false))).toEqual({ present: 0, level: "controlled" });
    expect(scoreControl({ ...all(false), smell: true })?.level).toBe("partly");
    expect(scoreControl({ ...all(false), smell: true, endoscopy: true })?.level).toBe("partly");
    expect(scoreControl({ ...all(false), smell: true, endoscopy: true, rescue: true })).toEqual({ present: 3, level: "uncontrolled" });
    expect(scoreControl(all(true))?.present).toBe(7);
  });
  it("needs every item answered", () => {
    expect(scoreControl({ blockage: true })).toBeNull();
  });
});

describe("EPOS/EUFOREA 2023 biologic indication", () => {
  const base: BiologicInput = { bilateralPolyps: true, priorSurgery: true };
  it("type 2 inflammation at the exact thresholds (blood eosinophils ≥150 since 2023)", () => {
    expect(scoreBiologic({ ...base, bloodEos: 149 })?.criteria.type2).toBe(false);
    expect(scoreBiologic({ ...base, bloodEos: 150 })?.criteria.type2).toBe(true);
    expect(scoreBiologic({ ...base, tissueEos: 9 })?.criteria.type2).toBe(false);
    expect(scoreBiologic({ ...base, tissueEos: 10 })?.criteria.type2).toBe(true);
    expect(scoreBiologic({ ...base, totalIge: 99 })?.criteria.type2).toBe(false);
    expect(scoreBiologic({ ...base, totalIge: 100 })?.criteria.type2).toBe(true);
  });
  it("systemic corticosteroids: ≥2 courses, long-term use or contraindication", () => {
    expect(scoreBiologic({ ...base, steroidCourses: 1 })?.criteria.steroids).toBe(false);
    expect(scoreBiologic({ ...base, steroidCourses: 2 })?.criteria.steroids).toBe(true);
    expect(scoreBiologic({ ...base, steroidLongTerm: true })?.criteria.steroids).toBe(true);
    expect(scoreBiologic({ ...base, steroidContraindicated: true })?.criteria.steroids).toBe(true);
  });
  it("SNOT-22 ≥40", () => {
    expect(scoreBiologic({ ...base, snot22: 39 })?.criteria.snot22).toBe(false);
    expect(scoreBiologic({ ...base, snot22: 40 })?.criteria.snot22).toBe(true);
  });
  it("3 of 5 after sinus surgery, 4 of 5 without", () => {
    const three: BiologicInput = { ...base, bloodEos: 300, snot22: 55, asthma: true, anosmia: false };
    expect(scoreBiologic(three)).toMatchObject({ met: 3, required: 3, meets: true });
    expect(scoreBiologic({ ...three, priorSurgery: false })).toMatchObject({ met: 3, required: 4, meets: false });
    expect(scoreBiologic({ ...three, priorSurgery: false, anosmia: true })).toMatchObject({ met: 4, meets: true });
  });
  it("never meets without bilateral polyps; incomplete without the two gate questions", () => {
    const all: BiologicInput = { bilateralPolyps: false, priorSurgery: true, bloodEos: 500, steroidCourses: 3, snot22: 80, anosmia: true, asthma: true };
    expect(scoreBiologic(all)).toMatchObject({ met: 5, meets: false });
    expect(scoreBiologic({ bloodEos: 500 })).toBeNull();
  });
});

describe("EPOS/EUFOREA 2023 response", () => {
  it("none (0), poor–moderate (1–3), good–excellent (4–5)", () => {
    const r = (n: number) =>
      scoreResponse({
        polyps: n > 0,
        rescue: n > 1,
        qol: n > 2,
        smell: n > 3,
        comorbidities: n > 4 ? "improved" : "not_improved",
      });
    expect(r(0)?.level).toBe("none");
    expect(r(1)?.level).toBe("poor_moderate");
    expect(r(3)?.level).toBe("poor_moderate");
    expect(r(4)?.level).toBe("good_excellent");
    expect(r(5)).toEqual({ met: 5, possible: 5, level: "good_excellent" });
  });
  it("comorbidities count only when present", () => {
    expect(scoreResponse({ polyps: true, rescue: true, qol: true, smell: true, comorbidities: "none" })).toEqual({
      met: 4,
      possible: 4,
      level: "good_excellent",
    });
    expect(scoreResponse({ polyps: true, rescue: true, qol: true, smell: false, comorbidities: "none" })?.level).toBe("poor_moderate");
  });
  it("needs every criterion answered", () => {
    expect(scoreResponse({ polyps: true, rescue: true, qol: true, smell: true })).toBeNull();
  });
});

describe("pack summary", () => {
  it("summarises only the included scales and lists the incomplete ones", () => {
    const scales = { nps: { right: 3, left: 2 }, lundMackay: { right: { maxillary: 2 } }, snot22: { value: 47 }, biologic: { bilateralPolyps: true, priorSurgery: true } };
    const s = summarizeRhinology(scales);
    expect(s.nps?.total).toBe(5);
    expect(s.lm).toBeNull();
    expect(s.snot22).toBe(47);
    expect(s.biologic?.met).toBe(1);
    expect("lk" in s).toBe(false);
    expect(incompleteScales(scales)).toEqual(["lundMackay"]);
    expect(summarizeRhinology({ snot22: { value: 40 }, biologic: { bilateralPolyps: true, priorSurgery: true } }).biologic?.criteria.snot22).toBe(true);
    expect(incompleteScales({ snot22: { value: 111 } })).toEqual(["snot22"]);
  });
});
