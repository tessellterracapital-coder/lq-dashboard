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
} from "recharts";
import { type MetroLQData } from "@/lib/useMultiLQData";
import { SUPERSECTORS } from "@/data/supersectors";

const METRO_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

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

function shortenMetroName(name: string): string {
  // Take the first city name before any dash or comma
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

interface CompareChartProps {
  metros: MetroLQData[];
}

interface ChartRow {
  sector: string;
  shortLabel: string;
  [key: string]: string | number;
}

export default function CompareChart({ metros }: CompareChartProps) {
  if (metros.length === 0) return null;

  // Build chart data: one row per supersector, one bar per metro
  const data: ChartRow[] = SUPERSECTORS.map((sector) => {
    const row: ChartRow = {
      sector: sector.label,
      shortLabel: shortenLabel(sector.label),
    };
    for (const metro of metros) {
      const result = metro.lqResults.find((r) => r.supersectorCode === sector.code);
      row[metro.metroSlug] = result?.hasData ? result.lq : 0;
    }
    return row;
  })
    .filter((row) => {
      // Only show sectors where at least one metro has data
      return metros.some((m) => (row[m.metroSlug] as number) > 0);
    })
    .sort((a, b) => {
      // Sort by the first metro's LQ descending
      const aVal = (a[metros[0].metroSlug] as number) || 0;
      const bVal = (b[metros[0].metroSlug] as number) || 0;
      return bVal - aVal;
    });

  const shortNames = Object.fromEntries(
    metros.map((m) => [m.metroSlug, shortenMetroName(m.metroName)])
  );

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      <div className="text-lg font-bold text-gray-100 mb-1">
        {Object.values(shortNames).join(" vs ")}
      </div>
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        LQ Comparison by Supersector
      </h3>
      <ResponsiveContainer width="100%" height={460}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <defs>
            {/* Metro 0: solid fill */}
            <pattern id="pattern-solid" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill={METRO_COLORS[0]} />
            </pattern>
            {/* Metro 1: diagonal stripes */}
            <pattern id="pattern-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={METRO_COLORS[1]} />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#0f1117" strokeWidth="2" />
            </pattern>
            {/* Metro 2: dots */}
            <pattern id="pattern-dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill={METRO_COLORS[2]} />
              <circle cx="3" cy="3" r="1.5" fill="#0f1117" />
            </pattern>
          </defs>
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
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 shadow-xl">
                  <div className="font-semibold text-gray-200 mb-2">{label}</div>
                  {payload.map((entry, i) => {
                    const shapes = ["●", "▨", "◌"];
                    return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-xs" style={{ color: METRO_COLORS[i] }}>{shapes[i]}</span>
                      <span className="text-gray-400">{shortNames[entry.dataKey as string] ?? entry.dataKey}:</span>
                      <span className="text-gray-100 font-mono">
                        {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
                      </span>
                    </div>
                    );
                  })}
                </div>
              );
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <ReferenceLine
            x={1.0}
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: "1.0", position: "top", fill: "#eab308", fontSize: 11 }}
          />
          {metros.map((metro, i) => {
            const patterns = ["url(#pattern-solid)", "url(#pattern-stripes)", "url(#pattern-dots)"];
            return (
              <Bar
                key={metro.metroSlug}
                dataKey={metro.metroSlug}
                fill={patterns[i]}
                stroke={METRO_COLORS[i]}
                strokeWidth={1}
                radius={[0, 4, 4, 0]}
                barSize={metros.length === 2 ? 14 : 10}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      {/* Custom legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {metros.map((metro, i) => {
          const labels = ["Solid", "Striped", "Dotted"];
          return (
            <div key={metro.metroSlug} className="flex items-center gap-2 text-sm">
              <svg width="16" height="12" viewBox="0 0 16 12">
                <rect width="16" height="12" rx="2" fill={METRO_COLORS[i]} />
                {i === 1 && <>
                  <line x1="0" y1="12" x2="12" y2="0" stroke="#0f1117" strokeWidth="1.5" />
                  <line x1="4" y1="12" x2="16" y2="0" stroke="#0f1117" strokeWidth="1.5" />
                  <line x1="-4" y1="12" x2="8" y2="0" stroke="#0f1117" strokeWidth="1.5" />
                </>}
                {i === 2 && <>
                  <circle cx="4" cy="4" r="1.5" fill="#0f1117" />
                  <circle cx="12" cy="4" r="1.5" fill="#0f1117" />
                  <circle cx="8" cy="9" r="1.5" fill="#0f1117" />
                </>}
              </svg>
              <span className="text-gray-400">{shortNames[metro.metroSlug]}</span>
              <span className="text-gray-600 text-xs">({labels[i]})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
