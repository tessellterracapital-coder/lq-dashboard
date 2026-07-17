"use client";

import { useState } from "react";
import { type LQResult } from "@/lib/blsApi";
import { lqColorClass } from "@/lib/lqMetrics";

// Sub-industries within each supersector (2-digit NAICS level)
// These are the main subdivisions BLS publishes at the metro level
const SUBSECTORS: Record<string, Array<{ code: string; label: string }>> = {
  "15000000": [
    { code: "15200000", label: "Construction" },
    { code: "15100000", label: "Mining & Logging" },
  ],
  "30000000": [
    { code: "31000000", label: "Durable Goods" },
    { code: "32000000", label: "Nondurable Goods" },
  ],
  "40000000": [
    { code: "41000000", label: "Wholesale Trade" },
    { code: "42000000", label: "Retail Trade" },
    { code: "43000000", label: "Transportation & Utilities" },
  ],
  "55000000": [
    { code: "55520000", label: "Finance & Insurance" },
    { code: "55530000", label: "Real Estate" },
  ],
  "60000000": [
    { code: "60540000", label: "Professional & Technical Svcs" },
    { code: "60550000", label: "Management of Companies" },
    { code: "60560000", label: "Administrative & Waste Svcs" },
  ],
  "65000000": [
    { code: "65610000", label: "Educational Services" },
    { code: "65620000", label: "Health Care & Social Assistance" },
  ],
  "70000000": [
    { code: "70710000", label: "Arts, Entertainment & Recreation" },
    { code: "70720000", label: "Accommodation & Food Services" },
  ],
  "90000000": [
    { code: "90910000", label: "Federal Government" },
    { code: "90920000", label: "State Government" },
    { code: "90930000", label: "Local Government" },
  ],
};

interface SubsectorDrilldownProps {
  results: LQResult[];
}

export default function SubsectorDrilldown({ results }: SubsectorDrilldownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const withData = results.filter((r) => r.hasData);

  function toggle(code: string) {
    setExpanded((prev) => (prev === code ? null : code));
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-xs uppercase tracking-wider text-gray-500">Sub-Sector Breakdown</div>
        <p className="text-xs text-gray-600 mt-1">Click a supersector to see its sub-industries</p>
      </div>
      <div className="divide-y divide-gray-800/50">
        {withData
          .sort((a, b) => b.lq - a.lq)
          .map((r) => {
            const subs = SUBSECTORS[r.supersectorCode];
            const isExpanded = expanded === r.supersectorCode;
            const hasSubs = subs && subs.length > 0;

            return (
              <div key={r.supersectorCode}>
                <button
                  onClick={() => hasSubs && toggle(r.supersectorCode)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    hasSubs ? "hover:bg-[#252836] cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {hasSubs && (
                      <span className={`text-gray-600 text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                        &#9654;
                      </span>
                    )}
                    {!hasSubs && <span className="w-3" />}
                    <span className="text-sm text-gray-200">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-gray-400">{r.localEmployment.toFixed(1)}K</span>
                    <span className="font-mono text-gray-400">{r.localPctOfTotal.toFixed(1)}%</span>
                    <span
                      className={`font-mono font-bold w-12 text-right ${lqColorClass(r.lq)}`}
                    >
                      {r.lq.toFixed(2)}
                    </span>
                  </div>
                </button>
                {isExpanded && subs && (
                  <div className="bg-[#0f1117]/50 border-t border-gray-800/50">
                    {subs.map((sub) => (
                      <div
                        key={sub.code}
                        className="flex items-center justify-between px-4 py-2 pl-10"
                      >
                        <span className="text-xs text-gray-400">{sub.label}</span>
                        <span className="text-xs text-gray-600 italic">
                          Detail available in full BLS data
                        </span>
                      </div>
                    ))}
                    <div className="px-4 py-2 pl-10">
                      <span className="text-xs text-gray-600">
                        Sub-sector employment data requires BLS NAICS-level queries.
                        Coming in a future update.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
