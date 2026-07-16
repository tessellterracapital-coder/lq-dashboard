// National CES series IDs (CE prefix) — used as LQ denominator.
//
// Each supersector maps to an ARRAY of national series that are SUMMED to form
// the denominator. This matters for Mining, Logging & Construction: the
// state/metro (SM) survey publishes a combined "15000000" supersector, but the
// national (CE) survey has no equivalent — it reports Mining & Logging
// (CEU1000000001) and Construction (CEU2000000001) separately. There is no
// "CEU1500000001". Summing the two national components reconstructs the correct
// denominator to match the SM combined series.
export const NATIONAL_SERIES_COMPONENTS: Record<string, string[]> = {
  "00000000": ["CEU0000000001"], // Total Nonfarm
  "15000000": ["CEU1000000001", "CEU2000000001"], // Mining & Logging + Construction
  "30000000": ["CEU3000000001"], // Manufacturing
  "40000000": ["CEU4000000001"], // Trade, Transportation & Utilities
  "50000000": ["CEU5000000001"], // Information
  "55000000": ["CEU5500000001"], // Financial Activities
  "60000000": ["CEU6000000001"], // Professional & Business Services
  "65000000": ["CEU6500000001"], // Education & Health Services
  "70000000": ["CEU7000000001"], // Leisure & Hospitality
  "80000000": ["CEU8000000001"], // Other Services
  "90000000": ["CEU9000000001"], // Government
};

/** Flat list of every national series ID that must be fetched. */
export const ALL_NATIONAL_SERIES_IDS: string[] = Array.from(
  new Set(Object.values(NATIONAL_SERIES_COMPONENTS).flat())
);

/**
 * Sum the component national series for a supersector.
 * Returns null if any component is missing — a partial sum would understate the
 * denominator and inflate the LQ.
 */
export function sumNationalComponents(
  supersectorCode: string,
  valuesBySeriesId: Record<string, number | undefined>
): number | null {
  const ids = NATIONAL_SERIES_COMPONENTS[supersectorCode];
  if (!ids) return null;
  let total = 0;
  for (const id of ids) {
    const v = valuesBySeriesId[id];
    if (v === undefined || v === null || isNaN(v)) return null;
    total += v;
  }
  return total;
}

/**
 * @deprecated Single-series map retained for backwards compatibility.
 * Does not include "15000000", which requires summing two national series —
 * use NATIONAL_SERIES_COMPONENTS / sumNationalComponents instead.
 */
export const NATIONAL_SERIES: Record<string, string> = {
  "00000000": "CEU0000000001",
  "30000000": "CEU3000000001",
  "40000000": "CEU4000000001",
  "50000000": "CEU5000000001",
  "55000000": "CEU5500000001",
  "60000000": "CEU6000000001",
  "65000000": "CEU6500000001",
  "70000000": "CEU7000000001",
  "80000000": "CEU8000000001",
  "90000000": "CEU9000000001",
};
