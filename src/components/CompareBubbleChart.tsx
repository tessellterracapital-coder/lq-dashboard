"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ZAxis,
} from "recharts";
import { type MetroLQData } from "@/lib/useMultiLQData";
import { type TrendResult } from "@/lib/blsApi";
import { computeMatchedGrowth } from "@/lib/lqMetrics";

const METRO_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

interface CompareBubbleChartProps {
  metros: MetroLQData[];
}

interface BubbleDatum {
  metroName: string;
  shortMetro: string;
  metroIndex: number;
  label: string;
  shortLabel: string;
  lq: number;
  growth: number;
  employment: number;
  isExport: boolean;
}

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

function shortenMetroName(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

function computeGrowth(trendData: TrendResult | null, supersectorCode: string): number {
  if (!trendData) return 0;
  const series = trendData.series.find((s) => s.supersectorCode === supersectorCode);
  if (!series || series.data.length < 2) return 0;
  // Month-matched: NSA data only supports over-the-year comparisons.
  return computeMatchedGrowth(series.data) ?? 0;
}

export default function CompareBubbleChart({ metros }: CompareBubbleChartProps) {
  if (metros.length === 0) return null;

  // Build data per metro
  const metroDataSets = metros.map((metro, i) => {
    const data: BubbleDatum[] = metro.lqResults
      .filter((r) => r.hasData && r.localEmployment > 0)
      .map((r) => ({
        metroName: metro.metroName,
        shortMetro: shortenMetroName(metro.metroName),
        metroIndex: i,
        label: r.label,
        shortLabel: shortenLabel(r.label),
        lq: r.lq,
        growth: computeGrowth(metro.trendData, r.supersectorCode),
        employment: r.localEmployment,
        isExport: r.lq > 1.0,
      }));
    return { data, color: METRO_COLORS[i], name: shortenMetroName(metro.metroName), slug: metro.metroSlug };
  });

  // Compute global Z domain across all metros
  const allEmployments = metroDataSets.flatMap((ds) => ds.data.map((d) => d.employment));
  const minEmp = Math.min(...allEmployments);
  const maxEmp = Math.max(...allEmployments);

  function getBubbleRadius(employment: number): number {
    if (maxEmp === minEmp) return Math.sqrt(675 / Math.PI);
    const t = (employment - minEmp) / (maxEmp - minEmp);
    const area = 150 + t * (1200 - 150);
    return Math.sqrt(area / Math.PI);
  }

  // Pattern IDs for each metro (defined in SVG defs below)
  const PATTERN_IDS = ["bubble-solid", "bubble-stripes", "bubble-dots"];

  function makeShape(metroColor: string, metroIndex: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function renderBubble(props: any) {
      const { cx, cy, payload } = props;
      const d = payload as BubbleDatum;
      const r = getBubbleRadius(d.employment);
      const lqText = d.lq.toFixed(2);
      const isLarge = r > 14;

      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={`url(#${PATTERN_IDS[metroIndex]})`} stroke={metroColor} strokeWidth={1.5} />
          {/* LQ value label */}
          <text
            x={cx}
            y={isLarge ? cy : cy - r - 4}
            textAnchor="middle"
            dominantBaseline={isLarge ? "central" : "auto"}
            fill={isLarge ? "#fff" : "#d1d5db"}
            fontSize={isLarge ? 10 : 9}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {lqText}
          </text>
          {/* Sector label — only for export sectors (LQ > 1.0) */}
          {d.isExport && (
            <text
              x={cx + r + 4}
              y={cy}
              textAnchor="start"
              dominantBaseline="central"
              fill="#9ca3af"
              fontSize={9}
            >
              {d.shortLabel}
            </text>
          )}
        </g>
      );
    };
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      <div className="text-lg font-bold text-gray-100 mb-1">
        {metroDataSets.map((ds) => ds.name).join(" vs ")}
      </div>
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        LQ vs. 10-Year Employment Growth
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Bubble size = employment level. X&#8209;axis = 10&#8209;year growth&nbsp;%. Y&#8209;axis = LQ. Export sectors (LQ &gt; 1.0) are labeled.
      </p>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 130, bottom: 20, left: 10 }}>
          <defs>
            {/* Metro 0: solid fill */}
            <pattern id="bubble-solid" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill={METRO_COLORS[0]} fillOpacity="0.55" />
            </pattern>
            {/* Metro 1: diagonal stripes */}
            <pattern id="bubble-stripes" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" fill={METRO_COLORS[1]} fillOpacity="0.55" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="#0f1117" strokeWidth="1.5" />
            </pattern>
            {/* Metro 2: dots */}
            <pattern id="bubble-dots" width="5" height="5" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill={METRO_COLORS[2]} fillOpacity="0.55" />
              <circle cx="2.5" cy="2.5" r="1.2" fill="#0f1117" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis
            type="number"
            dataKey="growth"
            name="Growth"
            unit="%"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
          >
            <Label
              value="10-Year Employment Growth %"
              position="bottom"
              offset={0}
              style={{ fill: "#6b7280", fontSize: 11 }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="lq"
            name="LQ"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            domain={[0, "auto"]}
          >
            <Label
              value="Location Quotient"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{ fill: "#6b7280", fontSize: 11 }}
            />
          </YAxis>
          <ZAxis
            type="number"
            dataKey="employment"
            range={[150, 1200]}
            domain={[minEmp, maxEmp]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as BubbleDatum;
              return (
                <div className="bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 shadow-xl">
                  <div className="font-semibold text-gray-200 mb-0.5">{d.shortMetro}</div>
                  <div className="text-sm text-gray-400 mb-1">{d.label}</div>
                  <div className="text-sm space-y-0.5">
                    <div className="text-gray-400">
                      LQ: <span className={`font-mono ${d.lq >= 1.2 ? "text-blue-400" : d.lq < 0.8 ? "text-red-400" : "text-gray-100"}`}>{d.lq.toFixed(2)}</span>
                    </div>
                    <div className="text-gray-400">
                      Growth: <span className={`font-mono ${d.growth >= 0 ? "text-green-400" : "text-red-400"}`}>{d.growth >= 0 ? "+" : ""}{d.growth.toFixed(1)}%</span>
                    </div>
                    <div className="text-gray-400">
                      Employment: <span className="text-gray-100 font-mono">{d.employment.toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              );
            }}
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
          />
          <ReferenceLine
            y={1.0}
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: "LQ = 1.0", position: "right", fill: "#eab308", fontSize: 11 }}
          />
          <ReferenceLine
            x={0}
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {metroDataSets.map((ds, i) => (
            <Scatter
              key={ds.slug}
              name={ds.name}
              data={ds.data}
              shape={makeShape(ds.color, i)}
              isAnimationActive={false}
              legendType="none"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      {/* Custom legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {metroDataSets.map((ds, i) => {
          const patterns = ["Solid", "Striped", "Dotted"];
          return (
            <div key={ds.slug} className="flex items-center gap-2 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill={ds.color} fillOpacity={0.55} stroke={ds.color} strokeWidth="1.5" />
                {i === 1 && <line x1="3" y1="13" x2="13" y2="3" stroke="#0f1117" strokeWidth="1.5" />}
                {i === 1 && <line x1="6" y1="16" x2="16" y2="6" stroke="#0f1117" strokeWidth="1.5" />}
                {i === 1 && <line x1="0" y1="10" x2="10" y2="0" stroke="#0f1117" strokeWidth="1.5" />}
                {i === 2 && <circle cx="8" cy="8" r="2" fill="#0f1117" />}
              </svg>
              <span className="text-gray-400">{ds.name}</span>
              <span className="text-gray-600 text-xs">({patterns[i]})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
