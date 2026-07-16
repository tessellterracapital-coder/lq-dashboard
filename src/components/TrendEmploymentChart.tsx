"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { type TrendResult } from "@/lib/blsApi";

const SECTOR_COLORS: Record<string, string> = {
  "15000000": "#ef4444", // Mining/Construction — red
  "30000000": "#f97316", // Manufacturing — orange
  "40000000": "#eab308", // Trade/Transport — yellow
  "50000000": "#22c55e", // Information — green
  "55000000": "#14b8a6", // Financial — teal
  "60000000": "#3b82f6", // Prof. & Business — blue
  "65000000": "#8b5cf6", // Education & Health — violet
  "70000000": "#ec4899", // Leisure & Hospitality — pink
  "80000000": "#6b7280", // Other Services — gray
  "90000000": "#a78bfa", // Government — light purple
};

function shortenLabel(label: string): string {
  const map: Record<string, string> = {
    "Mining, Logging & Construction": "Mining/Constr.",
    "Trade, Transportation & Utilities": "Trade/Transport",
    "Professional & Business Services": "Prof. & Business",
    "Education & Health Services": "Edu. & Health",
    "Leisure & Hospitality": "Leisure/Hosp.",
    "Financial Activities": "Financial",
    "Other Services": "Other Svcs",
    Manufacturing: "Manufacturing",
    Information: "Information",
    Government: "Government",
  };
  return map[label] ?? label;
}

interface TrendEmploymentChartProps {
  trendData: TrendResult;
  visibleSectors: Set<string>;
}

export default function TrendEmploymentChart({ trendData, visibleSectors }: TrendEmploymentChartProps) {
  // Build chart data: one row per date, one key per supersector
  const dateMap = new Map<string, Record<string, number | string>>();

  for (const series of trendData.series) {
    if (!visibleSectors.has(series.supersectorCode)) continue;
    for (const dp of series.data) {
      if (!dateMap.has(dp.date)) dateMap.set(dp.date, { date: dp.date });
      dateMap.get(dp.date)![series.supersectorCode] = dp.employment;
    }
  }

  const data = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  if (data.length === 0) return null;

  const visibleSeries = trendData.series.filter((s) => visibleSectors.has(s.supersectorCode));

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        Employment by Supersector (Thousands)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={{ stroke: "#374151" }}
            tickFormatter={(v: string) => {
              // Show "2015", "2016", ... only for January
              if (v.endsWith("-01")) return v.slice(0, 4);
              return "";
            }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            tickFormatter={(v: number) => `${v.toFixed(0)}K`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const [year, month] = (label as string).split("-");
              const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en", { month: "short" });
              return (
                <div className="bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 shadow-xl max-h-64 overflow-y-auto">
                  <div className="font-semibold text-gray-200 mb-2">{monthName} {year}</div>
                  {/* Copy before sorting: recharts types payload as a
                      ReadonlyArray, and sort() mutates in place — sorting it
                      directly would mutate recharts' internal payload. */}
                  {[...payload]
                    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
                    .map((entry, i) => {
                      const series = trendData.series.find((s) => s.supersectorCode === entry.dataKey);
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-gray-400 truncate">{series ? shortenLabel(series.label) : String(entry.dataKey ?? "")}</span>
                          <span className="text-gray-100 font-mono ml-auto">{Number(entry.value).toFixed(1)}K</span>
                        </div>
                      );
                    })}
                </div>
              );
            }}
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Legend
            formatter={(value: string) => {
              const series = trendData.series.find((s) => s.supersectorCode === value);
              return series ? shortenLabel(series.label) : value;
            }}
            wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
          />
          {visibleSeries.map((series) => (
            <Line
              key={series.supersectorCode}
              type="monotone"
              dataKey={series.supersectorCode}
              stroke={SECTOR_COLORS[series.supersectorCode] ?? "#6b7280"}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
