"use client";

import { useState, useEffect } from "react";
import { type TrendResult } from "@/lib/blsApi";
import { SUPERSECTORS } from "@/data/supersectors";
import TrendEmploymentChart from "./TrendEmploymentChart";
import TrendLQChart from "./TrendLQChart";
import TrendSummaryTable from "./TrendSummaryTable";

const SECTOR_COLORS: Record<string, string> = {
  "15000000": "#ef4444",
  "30000000": "#f97316",
  "40000000": "#eab308",
  "50000000": "#22c55e",
  "55000000": "#14b8a6",
  "60000000": "#3b82f6",
  "65000000": "#8b5cf6",
  "70000000": "#ec4899",
  "80000000": "#6b7280",
  "90000000": "#a78bfa",
};

function shortenLabel(label: string): string {
  const map: Record<string, string> = {
    "Mining, Logging & Construction": "Mining/Constr.",
    "Trade, Transportation & Utilities": "Trade/Transport",
    "Professional & Business Services": "Prof. & Business",
    "Education & Health Services": "Edu. & Health",
    "Leisure & Hospitality": "Leisure/Hosp.",
    "Financial Activities": "Financial",
    "Other Services": "Other Svcs",
    Manufacturing: "Manufacturing",
    Information: "Information",
    Government: "Government",
  };
  return map[label] ?? label;
}

interface TrendSectionProps {
  trendData: TrendResult | null;
  loading: boolean;
  error: string | null;
}

export default function TrendSection({ trendData, loading, error }: TrendSectionProps) {
  const availableCodes = new Set(trendData?.series.map((s) => s.supersectorCode) ?? []);
  const [visibleSectors, setVisibleSectors] = useState<Set<string>>(new Set());

  // Sync visible sectors when trend data loads
  const codesKey = Array.from(availableCodes).sort().join(",");
  useEffect(() => {
    if (availableCodes.size > 0) {
      setVisibleSectors(new Set(availableCodes));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey]);

  function toggleSector(code: string) {
    setVisibleSectors((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function selectAll() {
    setVisibleSectors(new Set(availableCodes));
  }

  function selectNone() {
    setVisibleSectors(new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-400">Fetching 10-year trend data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (!trendData || trendData.series.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Sector filter toggles */}
      <div className="bg-[#1a1d27] rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs uppercase tracking-wider text-gray-500">Sectors</span>
          <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">All</button>
          <button onClick={selectNone} className="text-xs text-blue-400 hover:text-blue-300">None</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPERSECTORS.filter((s) => availableCodes.has(s.code)).map((sector) => {
            const active = visibleSectors.has(sector.code);
            const color = SECTOR_COLORS[sector.code] ?? "#6b7280";
            return (
              <button
                key={sector.code}
                onClick={() => toggleSector(sector.code)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  active
                    ? "border-gray-600 text-gray-200"
                    : "border-gray-800 text-gray-600 opacity-50"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: active ? color : "#4b5563" }}
                />
                {shortenLabel(sector.label)}
              </button>
            );
          })}
        </div>
      </div>

      <TrendEmploymentChart trendData={trendData} visibleSectors={visibleSectors} />
      <TrendLQChart trendData={trendData} visibleSectors={visibleSectors} />

      <div>
        <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
          10-Year Change Summary
        </h2>
        <TrendSummaryTable trendData={trendData} />
      </div>
    </div>
  );
}
