"use client";

import { useState } from "react";
import { type LQResult } from "@/lib/blsApi";
import { formatJobs } from "@/lib/lqMetrics";

interface DataTableProps {
  results: LQResult[];
}

type SortKey =
  | "label"
  | "localEmployment"
  | "localPctOfTotal"
  | "lq"
  | "excessEmployment"
  | "classification";
type SortDir = "asc" | "desc";

export default function DataTable({ results }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("lq");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const withData = results.filter((r) => r.hasData);

  const sorted = [...withData].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "label") {
      cmp = a.label.localeCompare(b.label);
    } else if (sortKey === "classification") {
      cmp = a.classification.localeCompare(b.classification);
    } else {
      cmp = a[sortKey] - b[sortKey];
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300"
              onClick={() => handleSort("label")}
            >
              Industry <SortIcon column="label" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("localEmployment")}
            >
              Employment (K) <SortIcon column="localEmployment" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("localPctOfTotal")}
            >
              % of Total <SortIcon column="localPctOfTotal" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("lq")}
            >
              LQ <SortIcon column="lq" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("excessEmployment")}
              title="Jobs beyond what the metro needs to serve itself — the export base"
            >
              Excess Jobs <SortIcon column="excessEmployment" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300"
              onClick={() => handleSort("classification")}
            >
              Classification <SortIcon column="classification" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.supersectorCode}
              className="border-b border-gray-800/50 hover:bg-[#252836] transition-colors"
            >
              <td className="px-4 py-3 text-gray-200">{row.label}</td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {row.localEmployment.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {row.localPctOfTotal.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold">
                <span
                  className={
                    row.lq > 1.0
                      ? "text-blue-400"
                      : row.lq < 1.0
                      ? "text-red-400"
                      : "text-gray-300"
                  }
                >
                  {row.lq.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                <span className={row.excessEmployment > 0 ? "text-emerald-400" : "text-gray-500"}>
                  {row.excessEmployment > 0 ? "+" : ""}
                  {formatJobs(row.excessEmployment)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    row.classification === "Export"
                      ? "bg-blue-900/40 text-blue-400"
                      : row.classification === "Import"
                      ? "bg-red-900/30 text-red-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {row.classification}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {withData.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">No data available</div>
      )}
    </div>
  );
}
