"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { METROS, type Metro, getMetroBySlug } from "@/data/metros";
import { useMultiLQData } from "@/lib/useMultiLQData";
import MetroSelector from "@/components/MetroSelector";
import CompareChart from "@/components/CompareChart";
import CompareBubbleChart from "@/components/CompareBubbleChart";
import CompareSummaryTable from "@/components/CompareSummaryTable";
import CompareDifferences from "@/components/CompareDifferences";
import ComparePresets from "@/components/ComparePresets";
import CompareDownloadButton from "@/components/CompareDownloadButton";

type CompareView = "bar" | "bubble";

const MAX_METROS = 3;

function ComparePageInner() {
  const [chartView, setChartView] = useState<CompareView>("bubble");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial slugs from query params: ?m1=slug&m2=slug&m3=slug
  const initialSlugs = useMemo(() => {
    const slugs: string[] = [];
    for (let i = 1; i <= MAX_METROS; i++) {
      const s = searchParams.get(`m${i}`);
      if (s) slugs.push(s);
    }
    return slugs;
  }, [searchParams]);

  const [selectedMetros, setSelectedMetros] = useState<Metro[]>(() =>
    initialSlugs
      .map((s) => getMetroBySlug(s))
      .filter((m): m is Metro => m !== undefined)
  );

  const selections = useMemo(
    () =>
      selectedMetros.map((m) => ({
        stateCode: m.stateCode,
        areaCode: m.areaCode,
        name: m.name,
        slug: m.slug,
      })),
    [selectedMetros]
  );

  const { metros, loading, error } = useMultiLQData(selections);

  const updateUrl = useCallback(
    (newMetros: Metro[]) => {
      const params = new URLSearchParams();
      newMetros.forEach((m, i) => params.set(`m${i + 1}`, m.slug));
      router.replace(`/compare?${params.toString()}`);
    },
    [router]
  );

  function handleAdd(metro: Metro) {
    if (selectedMetros.find((m) => m.slug === metro.slug)) return;
    if (selectedMetros.length >= MAX_METROS) return;
    const next = [...selectedMetros, metro];
    setSelectedMetros(next);
    updateUrl(next);
  }

  function handleRemove(slug: string) {
    const next = selectedMetros.filter((m) => m.slug !== slug);
    setSelectedMetros(next);
    updateUrl(next);
  }

  const availableMetros = METROS.filter(
    (m) => !selectedMetros.find((s) => s.slug === m.slug)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Compare Metros</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select 2–3 metro areas to compare their economic profiles side by side.
        </p>
      </div>

      {/* Metro selection */}
      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800 space-y-4">
        {/* Selected metros as chips */}
        <div className="flex flex-wrap gap-2">
          {selectedMetros.map((metro, i) => {
            const colors = ["bg-blue-900/40 text-blue-400 border-blue-800", "bg-yellow-900/40 text-yellow-400 border-yellow-800", "bg-emerald-900/40 text-emerald-400 border-emerald-800"];
            return (
              <span
                key={metro.slug}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${colors[i]}`}
              >
                {metro.name}
                <button
                  onClick={() => handleRemove(metro.slug)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${metro.name}`}
                >
                  &times;
                </button>
              </span>
            );
          })}
          {selectedMetros.length === 0 && (
            <span className="text-gray-500 text-sm">No metros selected</span>
          )}
        </div>

        {/* Add metro dropdown */}
        {selectedMetros.length < MAX_METROS && (
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
              {selectedMetros.length === 0 ? "Add a metro" : "Add another metro"}{" "}
              ({MAX_METROS - selectedMetros.length} remaining)
            </label>
            <MetroSelector
              onSelect={handleAdd}
              metros={availableMetros}
            />
          </div>
        )}
      </div>

      {/* Loading / Error */}
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
      {!loading && !error && metros.length >= 2 && (
        <>
          {/* Per-metro summary cards */}
          <div className={`grid gap-4 ${metros.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
            {metros.map((metro, i) => {
              const colors = ["border-blue-800", "border-yellow-800", "border-emerald-800"];
              const textColors = ["text-blue-400", "text-yellow-400", "text-emerald-400"];
              const withData = metro.lqResults.filter((r) => r.hasData);
              const sorted = [...withData].sort((a, b) => b.lq - a.lq);
              const topExport = sorted[0];
              const exportCount = withData.filter((r) => r.lq > 1.0).length;

              return (
                <div
                  key={metro.metroSlug}
                  className={`bg-[#1a1d27] rounded-lg p-5 border ${colors[i]}`}
                >
                  <div className={`text-sm font-semibold ${textColors[i]} mb-3`}>
                    {metro.metroName}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Employment</span>
                      <span className="font-mono text-gray-200">{metro.totalEmployment.toFixed(1)}K</span>
                    </div>
                    {topExport && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Top Export</span>
                        <span className="text-gray-200">{topExport.label}</span>
                      </div>
                    )}
                    {topExport && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Top LQ</span>
                        <span className="font-mono font-bold text-blue-400">{topExport.lq.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Export Sectors</span>
                      <span className="font-mono text-gray-200">{exportCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart view toggle + download */}
          <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-[#1a1d27] border border-gray-800 rounded-lg p-1 w-fit">
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
          <CompareDownloadButton metros={metros} />
          </div>

          {chartView === "bubble" ? (
            <CompareBubbleChart metros={metros} />
          ) : (
            <CompareChart metros={metros} />
          )}

          <CompareDifferences metros={metros} />

          <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
              LQ by Supersector
            </h2>
            <CompareSummaryTable metros={metros} />
          </div>
        </>
      )}

      {!loading && !error && selectedMetros.length >= 1 && metros.length < 2 && selectedMetros.length < 2 && (
        <div className="text-center py-12 text-gray-500">
          Select at least one more metro to see the comparison.
        </div>
      )}

      {/* Quick comparison presets */}
      {selectedMetros.length === 0 && (
        <ComparePresets />
      )}
    </div>
  );
}

// useSearchParams() opts the subtree into client-side rendering, so Next
// requires a Suspense boundary above it to prerender this route statically.
export default function ComparePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading…</div>}>
      <ComparePageInner />
    </Suspense>
  );
}
