import { NATIONAL_SERIES } from "@/data/nationalSeries";
import { SUPERSECTORS, TOTAL_NONFARM_CODE } from "@/data/supersectors";
import { buildMetroSeriesId } from "@/data/metros";

const BLS_PROXY_URL = "/api/bls";

interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: Array<{ code?: string; text?: string }>;
}

interface BLSSeries {
  seriesID: string;
  data: BLSDataPoint[];
}

interface BLSResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: BLSSeries[];
  };
}

export interface EmploymentData {
  seriesId: string;
  supersectorCode: string;
  value: number; // in thousands
  year: string;
  period: string;
  footnotes: Array<{ code?: string; text?: string }>;
}

export interface LQResult {
  supersectorCode: string;
  label: string;
  localEmployment: number;
  localPctOfTotal: number;
  nationalEmployment: number;
  nationalPctOfTotal: number;
  lq: number;
  classification: "Export" | "Local" | "Import";
  hasData: boolean;
}

export interface TrendDataPoint {
  date: string; // "2015-01", "2015-02", etc.
  year: string;
  period: string;
  supersectorCode: string;
  label: string;
  employment: number;
  lq: number | null;
}

export interface TrendSeries {
  supersectorCode: string;
  label: string;
  data: TrendDataPoint[];
}

export interface TrendResult {
  series: TrendSeries[];
  startYear: string;
  endYear: string;
}

// In-memory caches
const nationalCache: Map<string, EmploymentData> = new Map();
const metroCache: Map<string, Map<string, EmploymentData>> = new Map();
const trendCache: Map<string, TrendResult> = new Map();

async function fetchBLSSeries(seriesIds: string[], startYear: string, endYear: string): Promise<BLSSeries[]> {
  const response = await fetch(BLS_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: startYear,
      endyear: endYear,
    }),
  });

  if (!response.ok) {
    throw new Error(`BLS API error: ${response.status}`);
  }

  const data: BLSResponse = await response.json();

  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new Error(`BLS API failed: ${data.message.join(", ")}`);
  }

  return data.Results.series;
}

function getMostRecentDataPoint(series: BLSSeries): BLSDataPoint | null {
  // Data is reverse chronological. Find the most recent monthly data (skip M13 annual average).
  const monthly = series.data.filter((d) => d.period !== "M13");
  return monthly.length > 0 ? monthly[0] : null;
}

export async function fetchNationalData(): Promise<Map<string, EmploymentData>> {
  if (nationalCache.size > 0) return nationalCache;

  const seriesIds = Object.values(NATIONAL_SERIES);
  const currentYear = new Date().getFullYear().toString();
  const startYear = (new Date().getFullYear() - 2).toString();

  const results = await fetchBLSSeries(seriesIds, startYear, currentYear);

  for (const series of results) {
    const supersectorCode = Object.entries(NATIONAL_SERIES).find(
      ([, id]) => id === series.seriesID
    )?.[0];
    if (!supersectorCode) continue;

    const dataPoint = getMostRecentDataPoint(series);
    if (!dataPoint) continue;

    nationalCache.set(supersectorCode, {
      seriesId: series.seriesID,
      supersectorCode,
      value: parseFloat(dataPoint.value),
      year: dataPoint.year,
      period: dataPoint.period,
      footnotes: dataPoint.footnotes,
    });
  }

  return nationalCache;
}

export async function fetchMetroData(
  stateCode: string,
  areaCode: string
): Promise<Map<string, EmploymentData>> {
  const cacheKey = `${stateCode}-${areaCode}`;
  if (metroCache.has(cacheKey)) return metroCache.get(cacheKey)!;

  const allCodes = [TOTAL_NONFARM_CODE, ...SUPERSECTORS.map((s) => s.code)];
  const seriesIds = allCodes.map((code) => buildMetroSeriesId(stateCode, areaCode, code));

  const currentYear = new Date().getFullYear().toString();
  const startYear = (new Date().getFullYear() - 2).toString();

  const results = await fetchBLSSeries(seriesIds, startYear, currentYear);

  const metroData = new Map<string, EmploymentData>();

  for (const series of results) {
    // Extract supersector code from series ID: SMU{state}{area}{supersector}01
    const prefix = `SMU${stateCode}${areaCode}`;
    const supersectorCode = series.seriesID.slice(prefix.length, prefix.length + 8);

    const dataPoint = getMostRecentDataPoint(series);
    if (!dataPoint) continue;

    metroData.set(supersectorCode, {
      seriesId: series.seriesID,
      supersectorCode,
      value: parseFloat(dataPoint.value),
      year: dataPoint.year,
      period: dataPoint.period,
      footnotes: dataPoint.footnotes,
    });
  }

  metroCache.set(cacheKey, metroData);
  return metroData;
}

export function computeLQ(
  metroData: Map<string, EmploymentData>,
  nationalData: Map<string, EmploymentData>
): LQResult[] {
  const localTotal = metroData.get(TOTAL_NONFARM_CODE)?.value ?? 0;
  const nationalTotal = nationalData.get(TOTAL_NONFARM_CODE)?.value ?? 0;

  if (localTotal === 0 || nationalTotal === 0) return [];

  return SUPERSECTORS.map((sector) => {
    const local = metroData.get(sector.code);
    const national = nationalData.get(sector.code);

    if (!local || !national || local.value === 0 || national.value === 0) {
      return {
        supersectorCode: sector.code,
        label: sector.label,
        localEmployment: local?.value ?? 0,
        localPctOfTotal: 0,
        nationalEmployment: national?.value ?? 0,
        nationalPctOfTotal: 0,
        lq: 0,
        classification: "Import" as const,
        hasData: false,
      };
    }

    const localShare = local.value / localTotal;
    const nationalShare = national.value / nationalTotal;
    const lq = localShare / nationalShare;

    let classification: "Export" | "Local" | "Import";
    if (lq >= 1.2) classification = "Export";
    else if (lq >= 0.8) classification = "Local";
    else classification = "Import";

    return {
      supersectorCode: sector.code,
      label: sector.label,
      localEmployment: local.value,
      localPctOfTotal: localShare * 100,
      nationalEmployment: national.value,
      nationalPctOfTotal: nationalShare * 100,
      lq: Math.round(lq * 100) / 100,
      classification,
      hasData: true,
    };
  });
}

// --- 10-Year Trend Data ---

// BLS v2 allows 50 series per request. We have 11 series (total nonfarm + 10 supersectors)
// per scope, so 22 total (national + metro) fits in one call — but we split them for clarity.

function periodToMonth(period: string): string {
  return period.replace("M", "").padStart(2, "0");
}

export async function fetchTrendData(
  stateCode: string,
  areaCode: string,
  startYear = "2015",
  endYear = "2025"
): Promise<TrendResult> {
  const cacheKey = `trend-${stateCode}-${areaCode}-${startYear}-${endYear}`;
  if (trendCache.has(cacheKey)) return trendCache.get(cacheKey)!;

  const allCodes = [TOTAL_NONFARM_CODE, ...SUPERSECTORS.map((s) => s.code)];
  const nationalSeriesIds = allCodes.map((code) => NATIONAL_SERIES[code]);
  const metroSeriesIds = allCodes.map((code) => buildMetroSeriesId(stateCode, areaCode, code));

  // Fetch national and metro in parallel (22 series total fits in 50-series limit,
  // but splitting avoids issues with series ID parsing)
  const [nationalResults, metroResults] = await Promise.all([
    fetchBLSSeries(nationalSeriesIds, startYear, endYear),
    fetchBLSSeries(metroSeriesIds, startYear, endYear),
  ]);

  // Build lookup: date -> supersectorCode -> value for national data
  const nationalByDate = new Map<string, Map<string, number>>();
  for (const series of nationalResults) {
    const supersectorCode = Object.entries(NATIONAL_SERIES).find(
      ([, id]) => id === series.seriesID
    )?.[0];
    if (!supersectorCode) continue;

    for (const dp of series.data) {
      if (dp.period === "M13") continue; // skip annual averages
      const date = `${dp.year}-${periodToMonth(dp.period)}`;
      if (!nationalByDate.has(date)) nationalByDate.set(date, new Map());
      nationalByDate.get(date)!.set(supersectorCode, parseFloat(dp.value));
    }
  }

  // Build metro time-series by supersector
  const prefix = `SMU${stateCode}${areaCode}`;
  const metroByDateBySector = new Map<string, Map<string, { value: number; year: string; period: string }>>();

  for (const series of metroResults) {
    const supersectorCode = series.seriesID.slice(prefix.length, prefix.length + 8);

    for (const dp of series.data) {
      if (dp.period === "M13") continue;
      const date = `${dp.year}-${periodToMonth(dp.period)}`;
      if (!metroByDateBySector.has(date)) metroByDateBySector.set(date, new Map());
      metroByDateBySector.get(date)!.set(supersectorCode, {
        value: parseFloat(dp.value),
        year: dp.year,
        period: dp.period,
      });
    }
  }

  // Compute LQ for each supersector at each month
  const sectorLabels = Object.fromEntries(SUPERSECTORS.map((s) => [s.code, s.label]));
  const trendBySector = new Map<string, TrendDataPoint[]>();

  const allDates = Array.from(metroByDateBySector.keys()).sort();

  for (const date of allDates) {
    const metroAtDate = metroByDateBySector.get(date)!;
    const nationalAtDate = nationalByDate.get(date);

    const localTotal = metroAtDate.get(TOTAL_NONFARM_CODE)?.value ?? 0;
    const nationalTotal = nationalAtDate?.get(TOTAL_NONFARM_CODE) ?? 0;

    for (const sector of SUPERSECTORS) {
      const localEntry = metroAtDate.get(sector.code);
      if (!localEntry) continue;

      const nationalValue = nationalAtDate?.get(sector.code) ?? 0;

      let lq: number | null = null;
      if (localTotal > 0 && nationalTotal > 0 && nationalValue > 0) {
        const localShare = localEntry.value / localTotal;
        const nationalShare = nationalValue / nationalTotal;
        lq = Math.round((localShare / nationalShare) * 100) / 100;
      }

      if (!trendBySector.has(sector.code)) trendBySector.set(sector.code, []);
      trendBySector.get(sector.code)!.push({
        date,
        year: localEntry.year,
        period: localEntry.period,
        supersectorCode: sector.code,
        label: sectorLabels[sector.code],
        employment: localEntry.value,
        lq,
      });
    }
  }

  const result: TrendResult = {
    series: SUPERSECTORS
      .filter((s) => trendBySector.has(s.code))
      .map((s) => ({
        supersectorCode: s.code,
        label: s.label,
        data: trendBySector.get(s.code)!,
      })),
    startYear,
    endYear,
  };

  trendCache.set(cacheKey, result);
  return result;
}
