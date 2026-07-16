"use client";

import { useState, useEffect } from "react";
import { fetchNationalData, fetchMetroData, computeLQ, type LQResult, type EmploymentData } from "./blsApi";
import { loadScreeningData, type ScreeningMetro } from "./screeningData";
import { classifyLQ } from "./lqMetrics";

interface UseLQDataResult {
  lqResults: LQResult[];
  metroData: Map<string, EmploymentData> | null;
  loading: boolean;
  error: string | null;
  dataYear: string | null;
  dataPeriod: string | null;
}

function screeningToLQResults(metro: ScreeningMetro): LQResult[] {
  return metro.sectors.map((s) => ({
    supersectorCode: s.code,
    label: s.label,
    localEmployment: s.employment,
    localPctOfTotal: s.pctOfTotal,
    nationalEmployment: s.nationalEmployment ?? 0,
    nationalPctOfTotal: s.nationalPctOfTotal ?? 0,
    lq: s.lq,
    // Derived from the LQ rather than read from the JSON. Data files built
    // before the 1.0 threshold change carry a stale `classification` computed
    // at 1.2; deriving here keeps the app correct against any data vintage.
    classification: classifyLQ(s.lq),
    // Read, not recomputed: the pipeline derives this from unrounded shares,
    // and nationalPctOfTotal is stored rounded to one decimal.
    excessEmployment: s.excessEmployment,
    hasData: true,
  }));
}

function screeningToMetroData(metro: ScreeningMetro): Map<string, EmploymentData> {
  const map = new Map<string, EmploymentData>();
  // Add total nonfarm
  map.set("00000000", {
    seriesId: "",
    supersectorCode: "00000000",
    value: metro.totalEmployment,
    year: metro.dataYear,
    period: metro.dataPeriod,
    footnotes: [],
  });
  for (const s of metro.sectors) {
    map.set(s.code, {
      seriesId: "",
      supersectorCode: s.code,
      value: s.employment,
      year: metro.dataYear,
      period: metro.dataPeriod,
      footnotes: [],
    });
  }
  return map;
}

export function useLQData(stateCode: string | null, areaCode: string | null): UseLQDataResult {
  const [lqResults, setLqResults] = useState<LQResult[]>([]);
  const [metroData, setMetroData] = useState<Map<string, EmploymentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataYear, setDataYear] = useState<string | null>(null);
  const [dataPeriod, setDataPeriod] = useState<string | null>(null);

  useEffect(() => {
    if (!stateCode || !areaCode) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Try static data first (zero API calls)
        const screening = await loadScreeningData();
        const staticMetro = screening.metros.find(
          (m) => m.stateCode === stateCode && m.areaCode === areaCode
        );

        if (staticMetro && !cancelled) {
          setLqResults(screeningToLQResults(staticMetro));
          setMetroData(screeningToMetroData(staticMetro));
          setDataYear(staticMetro.dataYear);
          setDataPeriod(staticMetro.dataPeriod);
          setLoading(false);
          return;
        }

        // Fallback to live API
        const [national, metro] = await Promise.all([
          fetchNationalData(),
          fetchMetroData(stateCode!, areaCode!),
        ]);

        if (cancelled) return;

        const results = computeLQ(metro, national);
        setLqResults(results);
        setMetroData(metro);

        const totalNonfarm = metro.get("00000000");
        if (totalNonfarm) {
          setDataYear(totalNonfarm.year);
          setDataPeriod(totalNonfarm.period);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stateCode, areaCode]);

  return { lqResults, metroData, loading, error, dataYear, dataPeriod };
}
