// ENT Senses Hearing — level arithmetic used by the calibrated audiometer.
import { describe, expect, it } from "vitest";
import {
  calibratedFrequencies,
  dbfsToGain,
  emptyPerEar,
  hlToDbfs,
  isProfileUsable,
  maxHl,
  SAFETY_MAX_HL,
  stepLevel,
  zeroFromMeasurement,
  zerosFromMeasurements,
} from "../src/modules/hearing/audio/levels";

describe("hearing levels", () => {
  it("objective calibration: zero = reference − (measured − RETSPL)", () => {
    // −20 dBFS produces 81 dB SPL; RETSPL 6 dB → 0 dB HL needs 75 dB less → −95 dBFS
    expect(zeroFromMeasurement(-20, 81, 6)).toBe(-95);
    expect(hlToDbfs(40, -95)).toBe(-55);
    expect(dbfsToGain(-20)).toBeCloseTo(0.1, 10);
    expect(dbfsToGain(0)).toBe(1);
  });

  it("maximum level is limited by headroom (5 dB steps) and by the safety ceiling", () => {
    expect(maxHl(-95, -3)).toBe(90); // headroom 92 dB → 90 (5 dB steps)
    expect(maxHl(-70, -3)).toBe(65);
    expect(maxHl(undefined, -3)).toBeNull();
    expect(maxHl(-200, -3)).toBe(SAFETY_MAX_HL);
  });

  it("level steps stay within −10 dB HL and the maximum", () => {
    expect(stepLevel(30, 5, 60)).toBe(35);
    expect(stepLevel(60, 5, 60)).toBe(60);
    expect(stepLevel(-10, -5, 60)).toBe(-10);
    expect(stepLevel(30, 5, null)).toBe(-10);
  });

  it("computes zeros only where measurement and RETSPL exist", () => {
    const m = emptyPerEar();
    m.right[1000] = 81;
    m.left[1000] = 80;
    m.right[2000] = 85;
    const z = zerosFromMeasurements(-20, m, { 1000: 6, 4000: 9 });
    expect(z.right[1000]).toBe(-95);
    expect(z.left[1000]).toBe(-94);
    expect(z.right[2000]).toBeUndefined();
    expect(calibratedFrequencies(z)).toEqual([1000]);
  });

  it("a profile is usable only in date, not archived and calibrated at 1 kHz in both ears", () => {
    const zero = { right: { 1000: -95 }, left: { 1000: -94 } };
    const today = new Date("2026-11-08T10:00:00Z");
    expect(isProfileUsable({ valid_until: "2027-11-08", zero_hl: zero }, today)).toBe(true);
    expect(isProfileUsable({ valid_until: "2026-11-07", zero_hl: zero }, today)).toBe(false);
    expect(isProfileUsable({ valid_until: "2027-11-08", archived: true, zero_hl: zero }, today)).toBe(false);
    expect(isProfileUsable({ valid_until: "2027-11-08", zero_hl: { right: { 1000: -95 }, left: {} } }, today)).toBe(false);
  });
});
