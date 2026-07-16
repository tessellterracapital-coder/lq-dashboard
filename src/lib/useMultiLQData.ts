"use client";

import { useState, useEffect } from "react";
import { fetchNationalData, fetchMetroData, computeLQ, fetchTrendData, type LQResult, type EmploymentData, type TrendResult } from "./blsApi";
import { loadScreeningData, loadMetroDetail } from "./screeningData";
import { classifyLQ } from "./lqMetrics";

export interface MetroLQData {
  stateCode: string;
  areaCode: string;
  metroName: string;
  metroSlug: string;
  lqResults: LQResult[];
  metroData: Map<string, EmploymentData>;
  trendData: TrendResult | null;
  totalEmployment: number;
  dataYear: string | null;
  dataPeriod: string | null;
}

interface UseMultiLQDataResult {
  metros: MetroLQData[];
  loading: boolean;
  error: string | null;
}

export function useMultiLQData(
  selections: Array<{ stateCode: string; areaCode: string; name: string; slug: string }>
): UseMultiLQDataResult {
  const [metros, setMetros] = useState<MetroLQData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = selections.map((s) => s.slug).join(",");

  useEffect(() => {
    if (selections.length === 0) {
      setMetros([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Try static data first
        const screening = await loadScreeningData();

        const results = await Promise.all(
          selections.map(async (sel) => {
            const staticMetro = screening.metros.find(
              (m) => m.stateCode === sel.stateCode && m.areaCode === sel.areaCode
            );

            if (staticMetro) {
              // Load trend data from static per-metro file
              const detail = await loadMetroDetail(staticMetro.slug);
              let trendData: TrendResult | null = null;
              if (detail?.trends?.length) {
                trendData = {
                  series: detail.trends.map((t) => ({
                    supersectorCode: t.supersectorCode,
                    label: t.label,
                    data: t.data.map((dp) => ({
                      date: dp.date,
                      year: dp.date.split("-")[0],
                      period: `M${dp.date.split("-")[1]}`,
                      supersectorCode: t.supersectorCode,
                      label: t.label,
                      employment: dp.employment,
                      lq: dp.lq,
                    })),
                  })),
                  startYear: "2015",
                  endYear: "2025",
                };
              }

              const metroDataMap = new Map<string, EmploymentData>();
              metroDataMap.set("00000000", {
                seriesId: "", supersectorCode: "00000000",
                value: staticMetro.totalEmployment,
                year: staticMetro.dataYear, period: staticMetro.dataPeriod, footnotes: [],
              });
              for (const s of staticMetro.sectors) {
                metroDataMap.set(s.code, {
                  seriesId: "", supersectorCode: s.code,
                  value: s.employment,
                  year: staticMetro.dataYear, period: staticMetro.dataPeriod, footnotes: [],
                });
              }

              return {
                stateCode: sel.stateCode,
                areaCode: sel.areaCode,
                metroName: sel.name,
                metroSlug: sel.slug,
                // No `as LQResult[]` here: the assertion this replaces was
                // hiding a missing excessEmployment, which reached the compare
                // table as undefined and rendered "-NaN".
                lqResults: staticMetro.sectors.map((s): LQResult => ({
                  supersectorCode: s.code,
                  label: s.label,
                  localEmployment: s.employment,
                  localPctOfTotal: s.pctOfTotal,
                  nationalEmployment: s.nationalEmployment ?? 0,
                  nationalPctOfTotal: s.nationalPctOfTotal ?? 0,
                  lq: s.lq,
                  // Derived, not read from the JSON — same as useLQData. Data
                  // files built before the 1.0 threshold change carry a stale
                  // `classification` computed at 1.2.
                  classification: classifyLQ(s.lq),
                  // Read, not recomputed — see ScreeningSector.excessEmployment.
                  excessEmployment: s.excessEmployment,
                  hasData: true,
                })),
                metroData: metroDataMap,
                trendData,
                totalEmployment: staticMetro.totalEmployment,
                dataYear: staticMetro.dataYear,
                dataPeriod: staticMetro.dataPeriod,
              };
            }

            // Fallback to live API
            const national = await fetchNationalData();
            const [metro, trend] = await Promise.all([
              fetchMetroData(sel.stateCode, sel.areaCode),
              fetchTrendData(sel.stateCode, sel.areaCode).catch(() => null),
            ]);
            const lqResults = computeLQ(metro, national);
            const totalNonfarm = metro.get("00000000");
            return {
              stateCode: sel.stateCode,
              areaCode: sel.areaCode,
              metroName: sel.name,
              metroSlug: sel.slug,
              lqResults,
              metroData: metro,
              trendData: trend,
              totalEmployment: totalNonfarm?.value ?? 0,
              dataYear: totalNonfarm?.year ?? null,
              dataPeriod: totalNonfarm?.period ?? null,
            };
          })
        );

        if (!cancelled) {
          setMetros(results);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { metros, loading, error };
}
