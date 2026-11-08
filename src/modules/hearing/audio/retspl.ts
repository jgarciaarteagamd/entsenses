// Reference equivalent threshold sound pressure levels (RETSPL, dB re 20 µPa) for common
// supra-aural audiometric headphones (ISO 389-1). They are PRE-FILLED VALUES ONLY: the values used
// must be confirmed against the standard and the technician's calibration certificate, and can
// be edited in each calibration profile.
export const RETSPL_PRESETS: Record<string, { label: string; coupler: string; values: Record<number, number> }> = {
  dd45: {
    label: "RadioEar DD45",
    coupler: "IEC 60318-3",
    values: { 125: 47.5, 250: 27.0, 500: 13.0, 750: 6.5, 1000: 6.0, 1500: 8.0, 2000: 8.0, 3000: 8.0, 4000: 9.0, 6000: 20.5, 8000: 12.0 },
  },
  tdh39: {
    label: "Telephonics TDH-39",
    coupler: "NBS 9-A / IEC 60318-3",
    values: { 125: 45.0, 250: 25.5, 500: 11.5, 750: 8.0, 1000: 7.0, 1500: 6.5, 2000: 9.0, 3000: 10.0, 4000: 9.5, 6000: 15.5, 8000: 13.0 },
  },
};
