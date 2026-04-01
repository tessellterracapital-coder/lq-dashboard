"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type ScreeningMetro } from "@/lib/screeningData";
import { METROS } from "@/data/metros";

type SortKey =
  | "name"
  | "totalEmployment"
  | "employmentGrowthPct"
  | "topExportSector"
  | "topExportLQ"
  | "exportCount"
  | "largestSectorPct";
type SortDir = "asc" | "desc";

interface ScreeningTableProps {
  metros: ScreeningMetro[];
}

export default function ScreeningTable({ metros }: ScreeningTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("totalEmployment");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = [...metros].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name" || sortKey === "topExportSector") {
      cmp = a[sortKey].localeCompare(b[sortKey]);
    } else if (sortKey === "employmentGrowthPct") {
      cmp = (a.employmentGrowthPct ?? -999) - (b.employmentGrowthPct ?? -999);
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

  function handleRowClick(metro: ScreeningMetro) {
    // Match by stateCode + areaCode since slugs differ between BLS names and our predefined list
    const known = METROS.find(
      (m) => m.stateCode === metro.stateCode && m.areaCode === metro.areaCode
    );
    router.push(`/metro/${known?.slug ?? metro.slug}`);
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-gray-600 ml-1">&#x21C5;</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>;
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300"
              onClick={() => handleSort("name")}
            >
              Metro <SortIcon column="name" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("totalEmployment")}
            >
              Employment (K) <SortIcon column="totalEmployment" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("employmentGrowthPct")}
            >
              10Y Growth <SortIcon column="employmentGrowthPct" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300"
              onClick={() => handleSort("topExportSector")}
            >
              Top Export <SortIcon column="topExportSector" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("topExportLQ")}
            >
              Top LQ <SortIcon column="topExportLQ" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("exportCount")}
            >
              Export Sectors <SortIcon column="exportCount" />
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-300 text-right"
              onClick={() => handleSort("largestSectorPct")}
            >
              Concentration <SortIcon column="largestSectorPct" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 200).map((metro) => (
            <tr
              key={`${metro.stateCode}-${metro.areaCode}`}
              onClick={() => handleRowClick(metro)}
              className="border-b border-gray-800/50 hover:bg-[#252836] transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 text-gray-200 max-w-xs truncate" title={metro.name}>
                <span>{metro.name}</span>
                {metro.areaType === "division" && (
                  <span className="ml-1.5 text-[10px] font-medium text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">
                    DIV
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {metro.totalEmployment.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {metro.employmentGrowthPct !== null ? (
                  <span className={metro.employmentGrowthPct >= 0 ? "text-green-400" : "text-red-400"}>
                    {metro.employmentGrowthPct >= 0 ? "+" : ""}{metro.employmentGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-600">N/A</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate" title={metro.topExportSector}>
                {metro.topExportSector}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold">
                <span className={metro.topExportLQ >= 1.2 ? "text-blue-400" : "text-gray-300"}>
                  {metro.topExportLQ.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {metro.exportCount}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                <span className={metro.largestSectorPct > 25 ? "text-red-400" : "text-gray-300"}>
                  {metro.largestSectorPct.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="px-4 py-12 text-center text-gray-500">
          No metros match your filters. Try adjusting the criteria.
        </div>
      )}
      {sorted.length > 200 && (
        <div className="px-4 py-3 text-center text-xs text-gray-600 border-t border-gray-800">
          Showing first 200 of {sorted.length} results. Narrow your filters to see more specific results.
        </div>
      )}
    </div>
  );
}
