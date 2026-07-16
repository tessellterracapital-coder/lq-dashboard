"use client";

import { Fragment } from "react";
import { type MetroLQData } from "@/lib/useMultiLQData";
import { SUPERSECTORS } from "@/data/supersectors";
import { formatJobs } from "@/lib/lqMetrics";

const METRO_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

interface CompareMetricsTableProps {
  metros: MetroLQData[];
}

function shortenMetroName(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

/** Excess as a share of the metro's total employment.
 *
 *  Deliberately not excess as a share of the sector's own jobs: that is
 *  (1 - 1/LQ), a pure function of the LQ already in the row, so it would repeat
 *  the LQ column in different units. Against metro total it says something new —
 *  how much of the whole job base this sector's surplus accounts for — and it is
 *  size-independent, so a 416K metro and a 3.5M one compare directly. Same
 *  convention as exportBasePct in the screening data. */
function excessPctOfMetro(excess: number, totalEmployment: number): number | null {
  if (!totalEmployment) return null;
  return (excess / totalEmployment) * 100;
}

function signed(n: number, digits = 1): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;
}

function signedJobs(thousands: number): string {
  return `${thousands >= 0 ? "+" : "−"}${formatJobs(Math.abs(thousands))}`;
}

export default function CompareMetricsTable({ metros }: CompareMetricsTableProps) {
  if (metros.length === 0) return null;

  const withData = SUPERSECTORS.filter((sector) =>
    metros.some((m) => m.lqResults.find((r) => r.supersectorCode === sector.code && r.hasData))
  );

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {/* Two header rows: each metro spans its three measures. */}
          <tr className="border-b border-gray-800/50">
            <th className="px-4 pt-3 pb-1 text-left text-xs uppercase tracking-wider text-gray-500">
              Industry
            </th>
            {metros.map((metro, i) => (
              <th
                key={metro.metroSlug}
                colSpan={3}
                className="px-4 pt-3 pb-1 text-center text-xs uppercase tracking-wider border-l border-gray-800/50"
                style={{ color: METRO_COLORS[i] }}
              >
                {shortenMetroName(metro.metroName)}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-800 text-right">
            <th className="px-4 pb-2" />
            {metros.map((metro) => (
              <Fragment key={metro.metroSlug}>
                <th className="px-3 pb-2 text-xs font-normal text-gray-600 border-l border-gray-800/50">
                  LQ
                </th>
                <th
                  className="px-3 pb-2 text-xs font-normal text-gray-600"
                  title="Jobs beyond what the metro needs to serve itself. Negative = net import."
                >
                  Excess
                </th>
                <th
                  className="px-3 pb-2 text-xs font-normal text-gray-600"
                  title="Excess as a share of the metro's total employment"
                >
                  % of metro
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {withData.map((sector) => (
            <tr
              key={sector.code}
              className="border-b border-gray-800/50 hover:bg-[#252836] transition-colors"
            >
              <td className="px-4 py-3 text-gray-200 whitespace-nowrap">{sector.label}</td>
              {metros.map((metro) => {
                const r = metro.lqResults.find(
                  (x) => x.supersectorCode === sector.code
                );
                if (!r?.hasData) {
                  return (
                    <Fragment key={metro.metroSlug}>
                      <td className="px-3 py-3 text-right text-gray-600 border-l border-gray-800/50">
                        N/A
                      </td>
                      <td className="px-3 py-3 text-right text-gray-600">&mdash;</td>
                      <td className="px-3 py-3 text-right text-gray-600">&mdash;</td>
                    </Fragment>
                  );
                }

                const pct = excessPctOfMetro(r.excessEmployment, metro.totalEmployment);
                const exportColor =
                  r.excessEmployment > 0 ? "text-blue-400" : r.excessEmployment < 0 ? "text-red-400" : "text-gray-300";

                return (
                  <Fragment key={metro.metroSlug}>
                    <td className="px-3 py-3 text-right font-mono font-bold border-l border-gray-800/50">
                      <span
                        className={
                          r.lq > 1.0 ? "text-blue-400" : r.lq < 1.0 ? "text-red-400" : "text-gray-300"
                        }
                      >
                        {r.lq.toFixed(2)}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${exportColor}`}>
                      {signedJobs(r.excessEmployment)}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${exportColor}`}>
                      {pct !== null ? `${signed(pct)}%` : "—"}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-gray-600 border-t border-gray-800/50">
        <strong className="text-gray-500">Excess</strong> is jobs beyond what the metro
        needs to serve itself &mdash; the export base, in jobs. Positive means the sector
        exports its surplus; negative means the metro imports the shortfall.{" "}
        <strong className="text-gray-500">% of metro</strong> expresses that against the
        metro&apos;s total employment, so metros of different sizes compare directly.
      </p>
    </div>
  );
}
