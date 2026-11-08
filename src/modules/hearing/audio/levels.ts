// ENT Senses Hearing — level arithmetic (pure functions, unit-tested).
//
// The calibration stores, per ear and frequency, the digital level in dBFS that produces 0 dB HL
// in the calibrated headphones ("zero"). Then:
//   dBFS(HL) = zero + HL
// An objective calibration measures the sound pressure level (dB SPL, artificial ear + sound level
// meter) produced by a reference digital level; with the reference equivalent threshold SPL of the
// headphone (RETSPL, ISO 389-1):
//   zero = referenceDbfs − (measuredSpl − RETSPL)

export const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export type EarSide = "right" | "left";
export type PerEar = Record<EarSide, Partial<Record<number, number>>>;

export const HL_MIN = -10;
export const HL_STEP = 5;
/** Absolute software ceiling, whatever the calibration allows. */
export const SAFETY_MAX_HL = 100;
/** Levels from here up are shown with a warning. */
export const HIGH_LEVEL_HL = 85;
export const DEFAULT_REFERENCE_DBFS = -20;
export const DEFAULT_MAX_DBFS = -3;

export const emptyPerEar = (): PerEar => ({ right: {}, left: {} });

export function zeroFromMeasurement(referenceDbfs: number, measuredSpl: number, retspl: number): number {
  return referenceDbfs - (measuredSpl - retspl);
}

export function hlToDbfs(hl: number, zero: number): number {
  return zero + hl;
}

export function dbfsToGain(dbfs: number): number {
  return 10 ** (dbfs / 20);
}

/** Highest presentable level (multiple of 5 dB) for a frequency: limited by headroom and safety. */
export function maxHl(zero: number | undefined, maxDbfs: number): number | null {
  if (zero === undefined || !Number.isFinite(zero)) return null;
  const byHeadroom = Math.floor((maxDbfs - zero) / HL_STEP) * HL_STEP;
  return Math.min(SAFETY_MAX_HL, byHeadroom);
}

/** Moves a level by delta, staying within [HL_MIN, max]. */
export function stepLevel(current: number, delta: number, max: number | null): number {
  const top = max ?? HL_MIN;
  return Math.max(HL_MIN, Math.min(top, current + delta));
}

/** Computes zero for every ear/frequency that has both a measurement and a RETSPL. */
export function zerosFromMeasurements(referenceDbfs: number, measured: PerEar, retspl: Partial<Record<number, number>>): PerEar {
  const out = emptyPerEar();
  for (const ear of ["right", "left"] as const) {
    for (const f of FREQUENCIES) {
      const m = measured[ear][f];
      const r = retspl[f];
      if (typeof m === "number" && Number.isFinite(m) && typeof r === "number" && Number.isFinite(r)) {
        out[ear][f] = Math.round(zeroFromMeasurement(referenceDbfs, m, r) * 10) / 10;
      }
    }
  }
  return out;
}

/** Frequencies calibrated in both ears. */
export function calibratedFrequencies(zero: PerEar): Frequency[] {
  return FREQUENCIES.filter((f) => typeof zero.right[f] === "number" && typeof zero.left[f] === "number");
}

/** A profile can be used on a given day if it is in date and calibrated at 1 kHz in both ears. */
export function isProfileUsable(p: { valid_until: string; archived?: boolean; zero_hl: PerEar }, today = new Date()): boolean {
  if (p.archived) return false;
  const day = today.toISOString().slice(0, 10);
  return p.valid_until >= day && calibratedFrequencies(p.zero_hl).includes(1000);
}
