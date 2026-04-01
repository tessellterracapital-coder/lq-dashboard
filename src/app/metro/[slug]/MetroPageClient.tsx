"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getMetroBySlug } from "@/data/metros";
import { useLQData } from "@/lib/useLQData";
import { useTrendData } from "@/lib/useTrendData";
import { useFavorites } from "@/lib/useFavorites";
import { computeHHI, getGrade, getGradeColor, getGradeLabel } from "@/lib/concentrationScore";
import { loadScreeningData } from "@/lib/screeningData";
import LQBarChart from "@/components/LQBarChart";
import LQBubbleChart from "@/components/LQBubbleChart";
import DataTable from "@/components/DataTable";
import SummaryCards from "@/components/SummaryCards";
import MetroSelector from "@/components/MetroSelector";
import TrendSection from "@/components/TrendSection";
import AdPlaceholder from "@/components/AdPlaceholder";
import ExportButton from "@/components/ExportButton";
import DownloadDataButton from "@/components/DownloadDataButton";
import NarrativeSummary from "@/components/NarrativeSummary";
import SimilarMetros from "@/components/SimilarMetros";
import SubsectorDrilldown from "@/components/SubsectorDrilldown";
import EmailSignup from "@/components/EmailSignup";
import { type Metro } from "@/data/metros";

type ChartView = "bar" | "bubble";

const PERIOD_NAMES: Record<string, string> = {
  M01: "January", M02: "February", M03: "March", M04: "April",
  M05: "May", M06: "June", M07: "July", M08: "August",
  M09: "September", M10: "October", M11: "November", M12: "December",
};

// Minimal metro info needed for the page
interface MetroInfo {
  stateCode: string;
  areaCode: string;
  name: string;
  slug: string;
}

export default function MetroPageClient() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Try predefined list first, then fall back to screening JSON
  const predefined = useMemo(() => getMetroBySlug(slug), [slug]);
  const [fallbackMetro, setFallbackMetro] = useState<MetroInfo | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(!predefined);

  useEffect(() => {
    if (predefined) return;
    let cancelled = false;
    loadScreeningData()
      .then((data) => {
        if (cancelled) return;
        const match = data.metros.find((m) => m.slug === slug);
        if (match) {
          setFallbackMetro({
            stateCode: match.stateCode,
            areaCode: match.areaCode,
            name: match.name,
            slug: match.slug,
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFallbackLoading(false); });
    return () => { cancelled = true; };
  }, [predefined, slug]);

  const metro: MetroInfo | null = predefined ?? fallbackMetro;

  const { lqResults, metroData, loading, error, dataYear, dataPeriod } = useLQData(
    metro?.stateCode ?? null,
    metro?.areaCode ?? null
  );
  const { trendData, loading: trendLoading, error: trendError } = useTrendData(
    metro?.stateCode ?? null,
    metro?.areaCode ?? null,
    metro?.slug ?? null
  );

  const [chartView, setChartView] = useState<ChartView>("bubble");
  const [copied, setCopied] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const totalEmployment = metroData?.get("00000000")?.value ?? 0;
  const { toggle: toggleFavorite, isFavorite } = useFavorites();

  // Concentration score
  const hhi = useMemo(() => computeHHI(lqResults), [lqResults]);
  const grade = getGrade(hhi);

  function handleSelect(m: Metro) {
    router.push(`/metro/${m.slug}`);
  }

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/metro/${slug}?view=${chartView}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [slug, chartView]);

  // Read chart view from URL on mount
  useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view === "bar" || view === "bubble") {
        setChartView(view);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (fallbackLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-400">Loading metro data...</span>
      </div>
    );
  }

  if (!metro) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Metro not found</h1>
        <p className="text-gray-400 mb-6">No data available for &quot;{slug}&quot;</p>
        <a href="/" className="text-blue-400 hover:underline">Back to search</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with metro selector */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{metro.name}</h1>
            <button
              onClick={() => toggleFavorite(metro.slug)}
              className={`text-xl transition-colors ${
                isFavorite(metro.slug) ? "text-yellow-400" : "text-gray-700 hover:text-yellow-400"
              }`}
              title={isFavorite(metro.slug) ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite(metro.slug) ? "\u2605" : "\u2606"}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {dataYear && dataPeriod && (
              <p className="text-sm text-gray-500">
                Data: {PERIOD_NAMES[dataPeriod] ?? dataPeriod} {dataYear} &middot; Total Nonfarm: {totalEmployment.toFixed(1)}K
              </p>
            )}
            {lqResults.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(grade)} bg-gray-800/50`}>
                Grade {grade}
                <span className="font-normal text-gray-500 ml-1 hidden sm:inline">
                  {getGradeLabel(grade)}
                </span>
              </span>
            )}
          </div>
        </div>
        <MetroSelector onSelect={handleSelect} selected={metro} />
      </div>

      {/* Leaderboard ad — desktop only, above chart area */}
      <div className="hidden sm:block">
        <AdPlaceholder format="leaderboard" />
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-3 text-gray-400">Fetching BLS data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && lqResults.length > 0 && (
        <>
          {/* Narrative summary */}
          <NarrativeSummary metroName={metro.name} results={lqResults} trendData={trendData} />

          <SummaryCards results={lqResults} totalEmployment={totalEmployment} />

          {/* Mobile banner ad — between summary cards and chart */}
          <div className="sm:hidden">
            <AdPlaceholder format="banner" />
          </div>

          {/* Chart controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-[#1a1d27] border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setChartView("bubble")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  chartView === "bubble"
                    ? "bg-[#252836] text-gray-100"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Bubble Chart
              </button>
              <button
                onClick={() => setChartView("bar")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  chartView === "bar"
                    ? "bg-[#252836] text-gray-100"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Bar Chart
              </button>
            </div>
            <div className="flex items-center gap-2">
              <DownloadDataButton metroName={metro.name} slug={metro.slug} results={lqResults} trendData={trendData} totalEmployment={totalEmployment} />
              <ExportButton targetRef={chartRef} filename={`metrolq-${metro.slug}`} />
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#1a1d27] border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          <div ref={chartRef}>
            {chartView === "bar" ? (
              <LQBarChart results={lqResults} metroName={metro.name} />
            ) : (
              <LQBubbleChart results={lqResults} trendData={trendData} metroName={metro.name} />
            )}
          </div>

          {/* Mobile rectangle ad — between chart and data table */}
          <div className="sm:hidden">
            <AdPlaceholder format="rectangle" />
          </div>

          <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
              Employment by Supersector
            </h2>
            <DataTable results={lqResults} />
          </div>

          {/* Sub-sector drill-down */}
          <SubsectorDrilldown results={lqResults} />

          {/* 10-Year Trends */}
          <div className="border-t border-gray-800 pt-6 mt-8">
            <h2 className="text-xl font-bold text-gray-100 mb-1">10-Year Trends</h2>
            <p className="text-sm text-gray-500 mb-6">
              Employment and LQ trends from 2015 to 2025
            </p>
            <TrendSection
              trendData={trendData!}
              loading={trendLoading}
              error={trendError}
            />
          </div>

          {/* Similar metros + Email signup */}
          <div className="border-t border-gray-800 pt-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimilarMetros
              currentSlug={metro.slug}
              currentStateCode={metro.stateCode}
              currentAreaCode={metro.areaCode}
              results={lqResults}
            />
            <EmailSignup />
          </div>
        </>
      )}
    </div>
  );
}
