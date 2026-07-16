"use client";

import { type LQResult } from "@/lib/blsApi";
import { isExport, computeExportBase, formatJobs } from "@/lib/lqMetrics";

interface SummaryCardsProps {
  results: LQResult[];
  totalEmployment: number;
}

export default function SummaryCards({ results, totalEmployment }: SummaryCardsProps) {
  const withData = results.filter((r) => r.hasData);
  if (withData.length === 0) return null;

  const sorted = [...withData].sort((a, b) => b.lq - a.lq);
  const topExport = sorted[0];
  const exportCount = withData.filter((r) => isExport(r.lq)).length;

  // Export base = total jobs beyond what the metro needs to serve itself.
  // This is the magnitude an employment multiplier acts on.
  const base = computeExportBase(
    withData.map((r) => ({
      employment: r.localEmployment,
      nationalPctOfTotal: r.nationalPctOfTotal,
      lq: r.lq,
    })),
    totalEmployment
  );

  const largestSector = [...withData].sort((a, b) => b.localPctOfTotal - a.localPctOfTotal)[0];
  const isConcentrated = largestSector.localPctOfTotal > 25;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Top Export Sector</div>
        <div className="text-lg font-semibold text-blue-400">{topExport.label}</div>
        <div className="text-2xl font-bold font-mono text-gray-100 mt-1">
          LQ {topExport.lq.toFixed(2)}
        </div>
      </div>

      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Export Sectors</div>
        <div className="text-2xl font-bold font-mono text-gray-100">{exportCount}</div>
        <div className="text-sm text-gray-400 mt-1">
          of {withData.length} with LQ &gt; 1.0
        </div>
      </div>

      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Export Base</div>
        <div className="text-2xl font-bold font-mono text-emerald-400">
          {formatJobs(base.jobs)}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          jobs ({base.pctOfTotal.toFixed(1)}% of total)
        </div>
      </div>

      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Largest Sector</div>
        <div className="text-lg font-semibold text-gray-300">{largestSector.label}</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold font-mono text-gray-100">
            {largestSector.localPctOfTotal.toFixed(1)}%
          </span>
          {isConcentrated && (
            <span className="text-xs text-red-400 font-medium px-2 py-0.5 bg-red-900/30 rounded">
              HIGH CONCENTRATION
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
