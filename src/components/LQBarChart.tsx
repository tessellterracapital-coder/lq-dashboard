"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { type LQResult } from "@/lib/blsApi";

interface LQBarChartProps {
  results: LQResult[];
  metroName?: string;
}

function getBarColor(lq: number): string {
  // Color break matches the 1.0 reference line drawn on this chart.
  if (lq > 1.0) return "#3b82f6"; // blue-500 — export
  if (lq === 1.0) return "#6b7280"; // gray-500 — balanced
  if (lq >= 0.8) return "#6b7280"; // gray-500 — local
  return "#ef4444"; // red-500 — import
}

function shortenLabel(label: string): string {
  const map: Record<string, string> = {
    "Mining, Logging & Construction": "Mining/Construction",
    "Trade, Transportation & Utilities": "Trade/Transport",
    "Professional & Business Services": "Prof. & Business Svcs",
    "Education & Health Services": "Education & Health",
    "Leisure & Hospitality": "Leisure & Hospitality",
    "Financial Activities": "Financial Activities",
    "Other Services": "Other Services",
    Manufacturing: "Manufacturing",
    Information: "Information",
    Government: "Government",
  };
  return map[label] ?? label;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: LQResult & { shortLabel: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 shadow-xl">
      <div className="font-semibold text-gray-200 mb-1">{d.label}</div>
      <div className="text-sm space-y-0.5">
        <div className="text-gray-400">
          LQ: <span className="text-gray-100 font-mono">{d.lq.toFixed(2)}</span>
        </div>
        <div className="text-gray-400">
          Employment: <span className="text-gray-100 font-mono">{d.localEmployment.toFixed(1)}K</span>
        </div>
        <div className="text-gray-400">
          Share: <span className="text-gray-100 font-mono">{d.localPctOfTotal.toFixed(1)}%</span>
        </div>
        <div className="text-gray-400">
          Classification:{" "}
          <span
            className={
              d.classification === "Export"
                ? "text-blue-400"
                : d.classification === "Import"
                ? "text-red-400"
                : "text-gray-300"
            }
          >
            {d.classification}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LQBarChart({ results, metroName }: LQBarChartProps) {
  const data = results
    .filter((r) => r.hasData)
    .sort((a, b) => b.lq - a.lq)
    .map((r) => ({ ...r, shortLabel: shortenLabel(r.label) }));

  if (data.length === 0) return null;

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      {metroName && (
        <div className="text-lg font-bold text-gray-100 mb-1">{metroName}</div>
      )}
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        Location Quotient by Supersector
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
          />
          <YAxis
            type="category"
            dataKey="shortLabel"
            width={170}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine x={1.0} stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" label={{ value: "1.0", position: "top", fill: "#eab308", fontSize: 11 }} />
          <Bar dataKey="lq" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.lq)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
