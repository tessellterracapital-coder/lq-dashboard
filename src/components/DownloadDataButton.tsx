"use client";

import { useCallback } from "react";
import { type LQResult } from "@/lib/blsApi";
import { type TrendResult } from "@/lib/blsApi";

interface DownloadDataButtonProps {
  metroName: string;
  slug: string;
  results: LQResult[];
  trendData?: TrendResult | null;
  totalEmployment?: number;
}

function buildLQCSV(metroName: string, results: LQResult[], totalEmployment?: number): string {
  const rows: string[] = [];
  rows.push("Industry,Employment (K),% of Total,LQ,Excess Employment (K),Classification");
  for (const r of results.filter((r) => r.hasData)) {
    rows.push(
      `"${r.label}",${r.localEmployment.toFixed(1)},${r.localPctOfTotal.toFixed(1)},${r.lq.toFixed(2)},${r.excessEmployment.toFixed(1)},${r.classification}`
    );
  }
  if (totalEmployment) {
    rows.push(`"Total Nonfarm",${totalEmployment.toFixed(1)},100.0,,,`);
  }
  return `"${metroName} — Location Quotient Data"\n\n${rows.join("\n")}`;
}

function buildTrendCSV(metroName: string, trendData: TrendResult): string {
  const rows: string[] = [];
  rows.push("Date,Industry,Employment (K),LQ");
  for (const series of trendData.series) {
    for (const dp of series.data) {
      rows.push(
        `${dp.date},"${dp.label}",${dp.employment.toFixed(1)},${dp.lq !== null ? dp.lq.toFixed(2) : ""}`
      );
    }
  }
  return `"${metroName} — 10-Year Trend Data"\n\n${rows.join("\n")}`;
}

export default function DownloadDataButton({ metroName, slug, results, trendData, totalEmployment }: DownloadDataButtonProps) {
  const handleDownload = useCallback(() => {
    const parts: string[] = [];
    parts.push(buildLQCSV(metroName, results, totalEmployment));
    if (trendData && trendData.series.length > 0) {
      parts.push(buildTrendCSV(metroName, trendData));
    }

    const csv = parts.join("\n\n\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metrolq-${slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metroName, slug, results, trendData, totalEmployment]);

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#1a1d27] border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
      title="Download data as CSV"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
      Download CSV
    </button>
  );
}
