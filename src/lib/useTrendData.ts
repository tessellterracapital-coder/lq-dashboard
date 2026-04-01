"use client";

import { useState, useEffect } from "react";
import { fetchTrendData, type TrendResult } from "./blsApi";
import { loadScreeningData, loadMetroDetail } from "./screeningData";

interface UseTrendDataResult {
  trendData: TrendResult | null;
  loading: boolean;
  error: string | null;
}

export function useTrendData(
  stateCode: string | null,
  areaCode: string | null,
  slug?: string | null
): UseTrendDataResult {
  const [trendData, setTrendData] = useState<TrendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateCode || !areaCode) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Resolve the correct static slug by stateCode + areaCode
        let staticSlug = slug;
        const screening = await loadScreeningData();
        const match = screening.metros.find(
          (m) => m.stateCode === stateCode && m.areaCode === areaCode
        );
        if (match) staticSlug = match.slug;

        // Try static per-metro detail file first (zero API calls)
        if (staticSlug) {
          const detail = await loadMetroDetail(staticSlug);
          if (detail && detail.trends && detail.trends.length > 0 && !cancelled) {
            const trendResult: TrendResult = {
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
            setTrendData(trendResult);
            setLoading(false);
            return;
          }
        }

        // Fallback to live API
        const data = await fetchTrendData(stateCode!, areaCode!);
        if (!cancelled) {
          setTrendData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch trend data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stateCode, areaCode, slug]);

  return { trendData, loading, error };
}
