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
import { type LQResult } from "@/lib/blsApi";
import { type TrendResult } from "@/lib/blsApi";
import { computeMatchedGrowth, paddedDomain, lqColorClass, classifyLQ } from "@/lib/lqMetrics";
import BubbleLabelLayer from "./BubbleLabelLayer";

interface LQBubbleChartProps {
  results: LQResult[];
  trendData: TrendResult | null;
  metroName?: string;
}

interface BubbleDatum {
  label: string;
  shortLabel: string;
  lq: number;
  growth: number;
  employment: number;
  classification: string;
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

// Derived from classifyLQ, so the bubble fill, the LQ in its tooltip and the
// label all break at the same place — the 1.0 reference line drawn on this chart.
function getColor(lq: number): string {
  const c = classifyLQ(lq);
  if (c === "Export") return "#3b82f6";
  if (c === "Under-represented") return "#ef4444";
  return "#6b7280"; // Balanced, exactly 1.0
}

function computeGrowth(trendData: TrendResult, supersectorCode: string): number | null {
  const series = trendData.series.find((s) => s.supersectorCode === supersectorCode);
  if (!series || series.data.length < 2) return null;
  // Month-matched: NSA data only supports over-the-year comparisons.
  return computeMatchedGrowth(series.data);
}

export default function LQBubbleChart({ results, trendData, metroName }: LQBubbleChartProps) {
  const data: BubbleDatum[] = results
    .filter((r) => r.hasData)
    .map((r) => {
      const growth = trendData ? computeGrowth(trendData, r.supersectorCode) : null;
      return {
        label: r.label,
        shortLabel: shortenLabel(r.label),
        lq: r.lq,
        growth: growth ?? 0,
        employment: r.localEmployment,
        classification: r.classification,
      };
    })
    .filter((d) => d.employment > 0);

  if (data.length === 0) return null;

  const maxEmp = Math.max(...data.map((d) => d.employment));
  const minEmp = Math.min(...data.map((d) => d.employment));

  // Frame the axes around the data, keeping the LQ = 1.0 and growth = 0
  // reference lines in view so the quadrants always render.
  const lqDomain = paddedDomain(data.map((d) => d.lq), 1.0, 0.1);
  const growthDomain = paddedDomain(data.map((d) => d.growth), 0, 5);

  // Compute bubble radius from employment for label sizing.
  // ZAxis range is [200, 2000] which maps to area, so radius = sqrt(area / pi).
  function getBubbleRadius(employment: number): number {
    if (maxEmp === minEmp) return Math.sqrt(1100 / Math.PI);
    const t = (employment - minEmp) / (maxEmp - minEmp);
    const area = 200 + t * (2000 - 200);
    return Math.sqrt(area / Math.PI);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderBubble(props: any) {
    const { cx, cy, payload } = props;
    const d = payload as BubbleDatum;
    const r = getBubbleRadius(d.employment);
    const color = getColor(d.lq);
    const lqText = d.lq.toFixed(2);
    // If bubble is large enough, place LQ inside; otherwise outside above
    const isLarge = r > 16;

    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
        {/* LQ value. Only drawn inside the bubble — a small bubble's LQ used to
            sit above it, where it collided with neighbouring sector labels. The
            tooltip carries the value for bubbles too small to hold it. */}
        {isLarge && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={11}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {lqText}
          </text>
        )}
      </g>
    );
  }

  // Sector labels are rendered by BubbleLabelLayer below, as a single layer on
  // top of every bubble — drawn per-point they were painted over by later
  // bubbles and by each other.
  const labelPoints = data.map((d) => ({
    x: d.growth,
    y: d.lq,
    r: getBubbleRadius(d.employment),
    text: d.shortLabel,
  }));

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      {metroName && (
        <div className="text-lg font-bold text-gray-100 mb-1">{metroName}</div>
      )}
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        LQ vs. 10-Year Employment Growth
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Bubble size = employment level. X&#8209;axis = 10&#8209;year growth&nbsp;%. Y&#8209;axis = current LQ.
      </p>
      <ResponsiveContainer width="100%" height={440}>
        <ScatterChart margin={{ top: 20, right: 120, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis
            type="number"
            dataKey="growth"
            name="Growth"
            unit="%"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#374151" }}
            domain={growthDomain}
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
            domain={lqDomain}
            tickFormatter={(v: number) => v.toFixed(2)}
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
            range={[200, 2000]}
            domain={[minEmp, maxEmp]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as BubbleDatum;
              return (
                <div className="bg-[#252836] border border-gray-700 rounded-lg px-4 py-3 shadow-xl">
                  <div className="font-semibold text-gray-200 mb-1">{d.label}</div>
                  <div className="text-sm space-y-0.5">
                    <div className="text-gray-400">
                      LQ: <span className={`font-mono ${lqColorClass(d.lq, "text-gray-100")}`}>{d.lq.toFixed(2)}</span>
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
          <Scatter data={data} shape={renderBubble} isAnimationActive={false} />
          {/* After <Scatter>, so labels layer above every bubble. */}
          <BubbleLabelLayer points={labelPoints} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
