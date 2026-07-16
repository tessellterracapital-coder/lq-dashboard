/**
 * Single source of truth for LQ classification and export-base magnitude.
 *
 * THRESHOLD
 * ---------
 * An LQ above 1.0 means a metro employs more people in a sector than its own
 * population consumes. That surplus is, by definition, exported — it draws
 * outside dollars into the region. Below 1.0 the metro is a net importer of
 * that activity. This is definitional arithmetic from economic base theory,
 * not a statistical inference, so there is nothing to "test" and no basis for
 * a buffer above 1.0.
 *
 * A previous version classified Export at LQ >= 1.2. That constant came from a
 * single line of the product spec scoped to one summary card, and was then
 * over-applied to the global classification — contradicting the same spec's
 * conceptual definition (LQ > 1.0) and the bar chart's own 1.0 reference line.
 * A ratio threshold is also the wrong instrument for significance: New York's
 * Professional & Business Services sits at LQ 1.16 with ~220,000 excess jobs,
 * while Guayama, PR's Government sits at LQ 2.21 with ~2,600. Any ratio cutoff
 * discards the former and keeps the latter.
 *
 * SIGNIFICANCE
 * ------------
 * Magnitude is carried by excess (basic) employment, not by the ratio. See
 * excessEmployment() below.
 */

export const EXPORT_THRESHOLD = 1.0;

export type Classification = "Export" | "Local" | "Import";

/**
 * Classify a sector by LQ.
 * > 1.0 exports its surplus; < 1.0 imports the shortfall; exactly 1.0 produces
 * precisely what it consumes (~1.5% of metro-sector pairs land here after
 * two-decimal rounding).
 */
export function classifyLQ(lq: number): Classification {
  if (lq > EXPORT_THRESHOLD) return "Export";
  if (lq < EXPORT_THRESHOLD) return "Import";
  return "Local";
}

export function isExport(lq: number): boolean {
  return lq > EXPORT_THRESHOLD;
}

/**
 * Excess (basic) employment — jobs beyond what the metro needs to serve itself.
 *
 *   expected = metroTotalEmployment x nationalShare
 *   excess   = actual - expected
 *
 * Algebraically identical to `actual x (1 - 1/LQ)`, where (1 - 1/LQ) is the
 * share of that sector's jobs which are exporting. We prefer the national-share
 * form because LQ is stored rounded to two decimals, which distorts the
 * reciprocal; nationalPctOfTotal gives a closer result to the unrounded value.
 *
 * Returns a value in the same units as the inputs (BLS publishes thousands).
 * Negative values indicate a net import position and are returned as-is —
 * callers that want the export base should sum only positive values.
 */
export function excessEmployment(
  sectorEmployment: number,
  metroTotalEmployment: number,
  nationalPctOfTotal: number | undefined,
  lq: number
): number {
  if (nationalPctOfTotal !== undefined && nationalPctOfTotal > 0) {
    const expected = metroTotalEmployment * (nationalPctOfTotal / 100);
    return sectorEmployment - expected;
  }
  // Fallback when the national share is unavailable.
  if (!lq || lq <= 0) return 0;
  return sectorEmployment * (1 - 1 / lq);
}

export interface ExportBase {
  /** Sum of positive excess across all sectors, in thousands. */
  jobs: number;
  /** Export base as a share of total metro employment, in percent. */
  pctOfTotal: number;
}

/**
 * Total export base for a metro: the sum of positive excess employment across
 * sectors. This is the quantity an employment multiplier acts on.
 *
 * Note this is a conservative floor. Cross-hauling within broad supersectors
 * (a metro shipping out truck parts while importing electronics — both
 * "Manufacturing") nets out and is therefore invisible here, so the true export
 * base is larger than this figure.
 */
export function computeExportBase(
  sectors: Array<{ employment: number; nationalPctOfTotal?: number; lq: number }>,
  metroTotalEmployment: number
): ExportBase {
  let jobs = 0;
  for (const s of sectors) {
    const e = excessEmployment(s.employment, metroTotalEmployment, s.nationalPctOfTotal, s.lq);
    if (e > 0) jobs += e;
  }
  return {
    jobs,
    pctOfTotal: metroTotalEmployment > 0 ? (jobs / metroTotalEmployment) * 100 : 0,
  };
}

/** Format an excess/employment value (in thousands) for display. */
export function formatJobs(thousands: number): string {
  const jobs = Math.round(thousands * 1000);
  return jobs.toLocaleString();
}
