"use client";

import { useXAxisScale, useYAxisScale, usePlotArea } from "recharts";
import { placeBubbleLabels, type LabelTarget } from "@/lib/lqMetrics";

export interface BubbleLabelPoint {
  /** X data value (growth %). */
  x: number;
  /** Y data value (LQ). */
  y: number;
  /** Bubble radius in pixels. */
  r: number;
  text: string;
  /** Overrides the layer default — used to colour labels per metro. */
  fill?: string;
}

interface BubbleLabelLayerProps {
  /** Every bubble in the chart, across all series: labels must avoid bubbles
   *  they do not belong to, so the whole set has to be placed together. */
  points: BubbleLabelPoint[];
  fontSize?: number;
}

/**
 * Sector labels, rendered as one layer on top of every bubble.
 *
 * Recharts draws each Scatter point as its own <g>, so a label drawn with its
 * bubble is painted over by any bubble that comes later in the data. Rendering
 * every label here — as a sibling placed after <Scatter> — puts the whole set
 * above the whole set of bubbles, and gives the placement pass all the
 * positions at once so labels can avoid each other too.
 *
 * Positions come from the chart's own scales rather than being recomputed, so
 * this stays correct as the container resizes.
 */
export default function BubbleLabelLayer({
  points,
  fontSize = 10,
}: BubbleLabelLayerProps) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plotArea = usePlotArea();

  if (!xScale || !yScale || !plotArea) return null;

  const projected = points.map((p) => ({
    cx: Number(xScale(p.x)),
    cy: Number(yScale(p.y)),
    r: p.r,
    text: p.text,
    fill: p.fill,
  }));

  if (projected.some((t) => !Number.isFinite(t.cx) || !Number.isFinite(t.cy))) return null;

  // Every bubble is an obstacle; only those with text get a label.
  const targets: LabelTarget[] = projected.filter((p) => p.text.length > 0);

  const placed = placeBubbleLabels(
    targets,
    projected,
    { left: plotArea.x, top: plotArea.y, width: plotArea.width, height: plotArea.height },
    fontSize
  );

  return (
    <g style={{ pointerEvents: "none" }}>
      {placed.map((l, i) => (
        <g key={`${l.text}-${i}`}>
          {l.line && (
            <line
              className={l.fill ? undefined : "bubble-label-line"}
              x1={l.line.x1}
              y1={l.line.y1}
              x2={l.line.x2}
              y2={l.line.y2}
              stroke={l.fill}
              strokeWidth={0.75}
              strokeOpacity={0.5}
            />
          )}
          {/* Halo first, so the label stays readable if it must sit near a
              bubble. Stroked in the card's background colour, which differs by
              theme — hence the class rather than a literal. */}
          <text
            className="bubble-label-halo"
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            dominantBaseline="central"
            fontSize={fontSize}
            strokeWidth={3}
            strokeLinejoin="round"
            opacity={0.9}
          >
            {l.text}
          </text>
          {/* No fill attribute unless the caller set one: the .bubble-label
              class carries the per-theme default, and an attribute here would
              defeat it. */}
          <text
            className={l.fill ? undefined : "bubble-label"}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            dominantBaseline="central"
            fontSize={fontSize}
            fill={l.fill}
          >
            {l.text}
          </text>
        </g>
      ))}
    </g>
  );
}
