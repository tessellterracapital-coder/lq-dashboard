"use client";

import { type TrendResult } from "@/lib/blsApi";
import { growthWindow } from "@/lib/lqMetrics";

interface TrendSummaryTableProps {
  trendData: TrendResult;
}

export default function TrendSummaryTable({ trendData }: TrendSummaryTableProps) {
  const rows = trendData.series
    .map((series) => {
      const sorted = [...series.data].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length < 2) return null;

      // Compare the same calendar month 10 years apart. The series runs from
      // Jan 2015 to whatever BLS last published, so taking its endpoints would
      // mix a seasonal trough against a seasonal peak in NSA data — and would
      // not span a decade. Falls back to the full range only if the matched
      // month is unavailable.
      const win = growthWindow(sorted);
      const first = (win && sorted.find((p) => p.date === win.start)) || sorted[0];
      const last = (win && sorted.find((p) => p.date === win.end)) || sorted[sorted.length - 1];

      const empChange = last.employment - first.employment;
      const empChangePct = first.employment !== 0 ? (empChange / first.employment) * 100 : 0;

      return {
        label: series.label,
        supersectorCode: series.supersectorCode,
        firstDate: first.date,
        lastDate: last.date,
        firstEmployment: first.employment,
        lastEmployment: last.employment,
        empChange,
        empChangePct,
        firstLQ: first.lq,
        lastLQ: last.lq,
        lqChange: first.lq !== null && last.lq !== null ? last.lq - first.lq : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  // Format date label: "2015-01" -> "Jan 2015"
  function formatDate(date: string): string {
    const [year, month] = date.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en", { month: "short" });
    return `${monthName} ${year}`;
  }

  const firstDate = rows[0].firstDate;
  const lastDate = rows[0].lastDate;

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Industry</th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              Emp. {formatDate(firstDate)}
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              Emp. {formatDate(lastDate)}
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              Change
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              LQ {formatDate(firstDate).split(" ")[1]}
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              LQ {formatDate(lastDate).split(" ")[1]}
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
              LQ Change
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.supersectorCode}
              className="border-b border-gray-800/50 hover:bg-[#252836] transition-colors"
            >
              <td className="px-4 py-3 text-gray-200">{row.label}</td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {row.firstEmployment.toFixed(1)}K
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {row.lastEmployment.toFixed(1)}K
              </td>
              <td className="px-4 py-3 text-right font-mono">
                <span className={row.empChangePct >= 0 ? "text-green-400" : "text-red-400"}>
                  {row.empChangePct >= 0 ? "+" : ""}{row.empChangePct.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {row.firstLQ !== null ? row.firstLQ.toFixed(2) : "N/A"}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {row.lastLQ !== null ? (
                  <span className={row.lastLQ >= 1.2 ? "text-blue-400" : row.lastLQ < 0.8 ? "text-red-400" : "text-gray-300"}>
                    {row.lastLQ.toFixed(2)}
                  </span>
                ) : "N/A"}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {row.lqChange !== null ? (
                  <span className={row.lqChange >= 0 ? "text-green-400" : "text-red-400"}>
                    {row.lqChange >= 0 ? "+" : ""}{row.lqChange.toFixed(2)}
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
