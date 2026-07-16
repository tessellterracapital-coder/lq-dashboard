"use client";

import { type MetroLQData } from "@/lib/useMultiLQData";
import { SUPERSECTORS } from "@/data/supersectors";

const METRO_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

interface CompareSummaryTableProps {
  metros: MetroLQData[];
}

function shortenMetroName(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

export default function CompareSummaryTable({ metros }: CompareSummaryTableProps) {
  if (metros.length === 0) return null;

  const withData = SUPERSECTORS.filter((sector) =>
    metros.some((m) => m.lqResults.find((r) => r.supersectorCode === sector.code && r.hasData))
  );

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500">
              Industry
            </th>
            {metros.map((metro, i) => (
              <th
                key={metro.metroSlug}
                className="px-4 py-3 text-xs uppercase tracking-wider text-right"
                style={{ color: METRO_COLORS[i] }}
              >
                {shortenMetroName(metro.metroName)}
              </th>
            ))}
            {metros.length >= 2 && (
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 text-right">
                Diff
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {withData.map((sector) => {
            const lqs = metros.map((m) => {
              const r = m.lqResults.find((r) => r.supersectorCode === sector.code);
              return r?.hasData ? r.lq : null;
            });
            const validLqs = lqs.filter((v): v is number => v !== null);
            const maxDiff =
              validLqs.length >= 2 ? Math.max(...validLqs) - Math.min(...validLqs) : null;

            return (
              <tr
                key={sector.code}
                className="border-b border-gray-800/50 hover:bg-[#252836] transition-colors"
              >
                <td className="px-4 py-3 text-gray-200">{sector.label}</td>
                {lqs.map((lq, i) => (
                  <td key={i} className="px-4 py-3 text-right font-mono font-bold">
                    {lq !== null ? (
                      <span
                        className={
                          lq > 1.0
                            ? "text-blue-400"
                            : lq < 1.0
                            ? "text-red-400"
                            : "text-gray-300"
                        }
                      >
                        {lq.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-600">N/A</span>
                    )}
                  </td>
                ))}
                {metros.length >= 2 && (
                  <td className="px-4 py-3 text-right font-mono text-gray-400">
                    {maxDiff !== null ? (
                      <span className={maxDiff >= 0.5 ? "text-yellow-400" : ""}>
                        {maxDiff.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
