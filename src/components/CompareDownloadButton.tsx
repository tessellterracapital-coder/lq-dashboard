"use client";

import { useCallback } from "react";
import { type MetroLQData } from "@/lib/useMultiLQData";
import { SUPERSECTORS } from "@/data/supersectors";

function shortenMetroName(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

interface CompareDownloadButtonProps {
  metros: MetroLQData[];
}

export default function CompareDownloadButton({ metros }: CompareDownloadButtonProps) {
  const handleDownload = useCallback(() => {
    const metroNames = metros.map((m) => shortenMetroName(m.metroName));

    // Header row. Excess columns mirror the on-screen table: jobs beyond what
    // the metro needs to serve itself, and that figure over the metro's total
    // employment. Both in thousands, as BLS publishes.
    const headers = ["Industry"];
    for (const name of metroNames) {
      headers.push(
        `${name} Emp (K)`,
        `${name} % of Total`,
        `${name} LQ`,
        `${name} Class.`,
        `${name} Excess (K)`,
        `${name} Excess % of Metro`
      );
    }

    const rows: string[] = [headers.join(",")];

    for (const sector of SUPERSECTORS) {
      const cols: string[] = [`"${sector.label}"`];
      for (const metro of metros) {
        const r = metro.lqResults.find((r) => r.supersectorCode === sector.code);
        if (r?.hasData) {
          const excessPct = metro.totalEmployment
            ? (r.excessEmployment / metro.totalEmployment) * 100
            : null;
          cols.push(
            r.localEmployment.toFixed(1),
            r.localPctOfTotal.toFixed(1),
            r.lq.toFixed(2),
            r.classification,
            r.excessEmployment.toFixed(1),
            excessPct !== null ? excessPct.toFixed(1) : ""
          );
        } else {
          cols.push("", "", "", "", "", "");
        }
      }
      rows.push(cols.join(","));
    }

    // Total row. The excess column totals the positive values only — that sum is
    // the metro's export base; netting imports against it would understate it.
    const totalCols: string[] = ['"Total Nonfarm"'];
    for (const metro of metros) {
      const exportBase = metro.lqResults
        .filter((r) => r.hasData)
        .reduce((sum, r) => sum + Math.max(0, r.excessEmployment), 0);
      const basePct = metro.totalEmployment ? (exportBase / metro.totalEmployment) * 100 : null;
      totalCols.push(
        metro.totalEmployment.toFixed(1),
        "100.0",
        "",
        "Export base:",
        exportBase.toFixed(1),
        basePct !== null ? basePct.toFixed(1) : ""
      );
    }
    rows.push(totalCols.join(","));

    const csv = `"Metro Comparison — ${metroNames.join(" vs ")}"\n\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metrolq-compare-${metros.map((m) => m.metroSlug).join("-vs-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metros]);

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#1a1d27] border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
      title="Download comparison data as CSV"
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
