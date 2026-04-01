export interface ScreeningSector {
  code: string;
  label: string;
  employment: number;
  pctOfTotal: number;
  nationalEmployment?: number;
  nationalPctOfTotal?: number;
  lq: number;
  classification: "Export" | "Local" | "Import";
}

export type AreaType = "msa" | "division";

export interface ScreeningMetro {
  stateCode: string;
  areaCode: string;
  name: string;
  slug: string;
  areaType: AreaType;
  totalEmployment: number;
  employmentGrowthPct: number | null;
  dataYear: string;
  dataPeriod: string;
  topExportSector: string;
  topExportLQ: number;
  exportCount: number;
  largestSector: string;
  largestSectorPct: number;
  sectors: ScreeningSector[];
  lq: Record<string, number>;
}

export interface MetroTrendPoint {
  date: string;
  employment: number;
  lq: number | null;
}

export interface MetroTrendSeries {
  supersectorCode: string;
  label: string;
  data: MetroTrendPoint[];
}

export interface MetroDetail extends ScreeningMetro {
  trends: MetroTrendSeries[];
}

export interface ScreeningData {
  generatedAt: string;
  nationalDataPeriod: string;
  metroCount: number;
  metros: ScreeningMetro[];
}

let cached: ScreeningData | null = null;

export async function loadScreeningData(): Promise<ScreeningData> {
  if (cached) return cached;
  const res = await fetch("/data/lq_all_metros.json");
  if (!res.ok) throw new Error("Failed to load screening data");
  cached = await res.json();
  return cached!;
}

const detailCache = new Map<string, MetroDetail>();

export async function loadMetroDetail(slug: string): Promise<MetroDetail | null> {
  if (detailCache.has(slug)) return detailCache.get(slug)!;
  try {
    const res = await fetch(`/data/metros/${slug}.json`);
    if (!res.ok) return null;
    const data: MetroDetail = await res.json();
    detailCache.set(slug, data);
    return data;
  } catch {
    return null;
  }
}
