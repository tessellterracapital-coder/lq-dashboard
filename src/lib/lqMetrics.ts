/**
 * Single source of truth for LQ classification and export-base magnitude.
 *
 * THRESHOLD
 * ---------
 * An LQ above 1.0 means a metro employs more people in a sector than its own
 * population consumes. That surplus is, by definition, exported — it draws
 * outside dollars into the region. Below 1.0 the sector is smaller than the
 * national mix; see the Classification type for why that is not the same as
 * importing. This is definitional arithmetic from economic base theory, not a
 * statistical inference, so there is nothing to "test" and no basis for a
 * buffer above 1.0.
 *
 * A previous version classified Export at LQ >= 1.2. That constant came from a
 * single line of the product spec scoped to one summary card, and was then
 * over-applied to the global classification — contradicting the same spec's
 * conceptual definition (LQ > 1.0) and the bar chart's own 1.0 reference line.
 * A ratio threshold is also the wrong instrument for significance: New York's
 * Professional & Business Services sits at LQ 1.15 with ~211,600 excess jobs,
 * while Guayama, PR's Government sits at LQ 2.25 with ~2,700. Any ratio cutoff
 * discards the former and keeps the latter.
 *
 * SIGNIFICANCE
 * ------------
 * Magnitude is carried by excess (basic) employment, not by the ratio. See
 * excessEmployment() below.
 */

export const EXPORT_THRESHOLD = 1.0;

/**
 * Below 1.0 is "Under-represented", not "Import".
 *
 * Economic base theory calls a below-1.0 sector an import, which assumes the
 * activity can cross a boundary. Much of it cannot. Los Angeles has a
 * construction LQ of 0.70 and −109,118 excess, but LA does not import buildings
 * from Ohio — construction happens where the building goes. The same holds for
 * healthcare, government and leisure. What the number actually says is that the
 * sector is smaller than the national mix, which is true either way.
 *
 * "Export" is kept: a surplus above local need really is sold outward, and that
 * reading holds wherever the activity is tradable.
 */
export type Classification = "Export" | "Balanced" | "Under-represented";

/**
 * Classify a sector by LQ.
 * > 1.0 has a surplus beyond local need; < 1.0 is smaller than the national
 * mix; exactly 1.0 matches it (~1.5% of metro-sector pairs land here after
 * two-decimal rounding).
 */
export function classifyLQ(lq: number): Classification {
  if (lq > EXPORT_THRESHOLD) return "Export";
  if (lq < EXPORT_THRESHOLD) return "Under-represented";
  return "Balanced";
}

export function isExport(lq: number): boolean {
  return lq > EXPORT_THRESHOLD;
}

/**
 * Text colour for an LQ, derived from classifyLQ so the two cannot disagree:
 * blue where the label says Export, red where it says Under-represented,
 * neutral at exactly 1.0.
 *
 * Kept here rather than written at each call site. Six components had drifted to
 * colouring at 1.2/0.8 while classification, the bubble fill and the charts'
 * reference line all broke at 1.0 — so 48.9% of sector rows rendered against
 * their own label. 788 export sectors carrying 4.47M jobs (21.5% of the national
 * export base) printed in neutral grey, New York's Professional & Business
 * Services among them: labelled Export, drawn as a blue bubble, its LQ greyed in
 * its own tooltip.
 *
 * A neutral band around 1.0 is a buffer, and the buffer is the thing that was
 * removed from the threshold — see the header. Do not reintroduce one here.
 *
 * `neutral` varies by surface: tooltips sit on a darker panel than tables.
 */
export function lqColorClass(lq: number, neutral = "text-gray-300"): string {
  const c = classifyLQ(lq);
  if (c === "Export") return "text-blue-400";
  if (c === "Under-represented") return "text-red-400";
  return neutral;
}

/**
 * Excess (basic) employment — jobs beyond what the metro needs to serve itself.
 *
 *   expected = metroTotalEmployment x nationalShare
 *   excess   = actual - expected
 *
 * Algebraically identical to `actual x (1 - 1/LQ)`, where (1 - 1/LQ) is the
 * share of that sector's jobs which are exporting. We prefer the national-share
 * form because LQ is stored rounded to two decimals, which distorts the
 * reciprocal; nationalPctOfTotal gives a closer result to the unrounded value.
 *
 * Returns a value in the same units as the inputs (BLS publishes thousands).
 * Negative values indicate a net import position and are returned as-is —
 * callers that want the export base should sum only positive values.
 */
export function excessEmployment(
  sectorEmployment: number,
  metroTotalEmployment: number,
  nationalPctOfTotal: number | undefined,
  lq: number
): number {
  if (nationalPctOfTotal !== undefined && nationalPctOfTotal > 0) {
    const expected = metroTotalEmployment * (nationalPctOfTotal / 100);
    return sectorEmployment - expected;
  }
  // Fallback when the national share is unavailable.
  if (!lq || lq <= 0) return 0;
  return sectorEmployment * (1 - 1 / lq);
}

export interface ExportBase {
  /** Sum of positive excess across all sectors, in thousands. */
  jobs: number;
  /** Export base as a share of total metro employment, in percent. */
  pctOfTotal: number;
}

/**
 * Total export base for a metro: the sum of positive excess employment across
 * sectors. This is the quantity an employment multiplier acts on.
 *
 * Note this is a conservative floor. Cross-hauling within broad supersectors
 * (a metro shipping out truck parts while importing electronics — both
 * "Manufacturing") nets out and is therefore invisible here, so the true export
 * base is larger than this figure.
 */
export function computeExportBase(
  sectors: Array<{ employment: number; nationalPctOfTotal?: number; lq: number }>,
  metroTotalEmployment: number
): ExportBase {
  let jobs = 0;
  for (const s of sectors) {
    const e = excessEmployment(s.employment, metroTotalEmployment, s.nationalPctOfTotal, s.lq);
    if (e > 0) jobs += e;
  }
  return {
    jobs,
    pctOfTotal: metroTotalEmployment > 0 ? (jobs / metroTotalEmployment) * 100 : 0,
  };
}

/** Format an excess/employment value (in thousands) for display. */
export function formatJobs(thousands: number): string {
  const jobs = Math.round(thousands * 1000);
  return jobs.toLocaleString();
}

// ---------------------------------------------------------------------------
// Employment growth
// ---------------------------------------------------------------------------

/** Number of years spanned by the headline growth figure. */
export const GROWTH_WINDOW_YEARS = 10;

export interface DatedEmployment {
  /** "YYYY-MM" */
  date: string;
  employment: number;
}

/**
 * Month-matched growth over GROWTH_WINDOW_YEARS, ending at the latest month
 * available in the series.
 *
 * BLS CES metro data is NOT seasonally adjusted, so only over-the-year
 * comparisons are valid — the same calendar month, N years apart. A previous
 * version compared the first point in the series (January 2015) to the last
 * available month, which mixed a seasonal trough against a seasonal peak and
 * inflated growth by roughly 5-6 percentage points, while spanning an arbitrary
 * window rather than a decade.
 *
 * Returns null when the matching month 10 years back is unavailable, rather
 * than silently falling back to a mismatched month.
 */
export function computeMatchedGrowth(points: DatedEmployment[]): number | null {
  if (!points || points.length < 2) return null;

  const sorted = [...points]
    .filter((p) => p && p.date && typeof p.employment === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const end = sorted[sorted.length - 1];
  const [ey, em] = end.date.split("-");
  const startDate = `${parseInt(ey, 10) - GROWTH_WINDOW_YEARS}-${em}`;

  const start = sorted.find((p) => p.date === startDate);
  if (!start || !start.employment) return null;

  return ((end.employment - start.employment) / start.employment) * 100;
}

/** The window actually used, for labelling. e.g. { start: "2016-05", end: "2026-05" } */
export function growthWindow(points: DatedEmployment[]): { start: string; end: string } | null {
  if (!points || points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const end = sorted[sorted.length - 1];
  const [ey, em] = end.date.split("-");
  const startDate = `${parseInt(ey, 10) - GROWTH_WINDOW_YEARS}-${em}`;
  if (!sorted.some((p) => p.date === startDate)) return null;
  return { start: startDate, end: end.date };
}

// ---------------------------------------------------------------------------
// Chart scaling
// ---------------------------------------------------------------------------

/**
 * A padded axis domain that frames the data instead of anchoring at zero.
 *
 * LQ clusters tightly around 1.0 (a typical metro spans ~0.75-1.25), so a
 * [0, "auto"] domain spends most of the axis on empty space below the data and
 * pushes the LQ = 1.0 reference line toward the top. Growth spans negative
 * values, and bubbles are drawn with a radius around their point, so an
 * unpadded domain clips the extremes at the plot edge.
 *
 * `anchor` is the reference line (LQ = 1.0, growth = 0), kept in view so the
 * quadrants always render. Bounds snap outward to `step` for clean ticks.
 */
export function paddedDomain(
  values: number[],
  anchor: number,
  step: number
): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [anchor - step, anchor + step];

  const lo = Math.min(...finite, anchor);
  const hi = Math.max(...finite, anchor);
  const pad = (hi - lo || step) * 0.12;

  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return [
    round(Math.floor((lo - pad) / step) * step),
    round(Math.ceil((hi + pad) / step) * step),
  ];
}

// ---------------------------------------------------------------------------
// Bubble label placement
// ---------------------------------------------------------------------------

/** A bubble, in pixel space. */
export interface BubbleCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface LabelTarget extends BubbleCircle {
  text: string;
  /** Passed through to the placed label, for per-series colouring. */
  fill?: string;
}

export interface PlacedLabel {
  x: number;
  y: number;
  text: string;
  fill?: string;
  /** SVG text-anchor: labels placed left of their bubble are right-aligned. */
  anchor: "start" | "end";
  /** Leader line back to the bubble edge, when the label had to be pushed away. */
  line: { x1: number; y1: number; x2: number; y2: number } | null;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Rough text width. SVG has no measurement API outside the DOM, and ~0.55em
 *  per character is close enough for the 10px sans labels used here. */
function textWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

/**
 * Place bubble labels so they collide with neither the bubbles nor each other.
 *
 * Every label used to sit at a fixed offset right of its bubble centre, so any
 * two bubbles at a similar height overlapped, and bubbles drawn later painted
 * over labels drawn earlier.
 *
 * Each label is tried at a ring of candidate offsets (right, left, then
 * diagonals and above/below at growing distance). The first candidate that hits
 * no bubble and no already-placed label wins. Labels are placed
 * largest-bubble-first so the visually dominant sectors keep the preferred
 * position, and anything pushed beyond its bubble edge gets a leader line. A
 * label with nowhere to go is dropped rather than drawn over something — the
 * tooltip still names it.
 *
 * `allBubbles` is every bubble in the chart, which is not always the same set
 * as `targets`: the compare chart labels only export sectors but must still
 * route around the rest.
 *
 * Callers render the returned labels in a single layer above every bubble.
 */
export function placeBubbleLabels(
  targets: LabelTarget[],
  allBubbles: BubbleCircle[],
  bounds: { left: number; top: number; width: number; height: number },
  fontSize = 10
): PlacedLabel[] {
  const GAP = 5;
  const lineHeight = fontSize + 2;

  const obstacles: Rect[] = allBubbles.map((b) => ({
    x: b.cx - b.r,
    y: b.cy - b.r,
    w: b.r * 2,
    h: b.r * 2,
  }));

  const placed: PlacedLabel[] = [];
  const placedRects: Rect[] = [];

  // Largest bubbles first: they dominate the chart, so they get first pick.
  const order = targets
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t.r - a.t.r);

  for (const { t } of order) {
    const w = textWidth(t.text, fontSize);
    const h = lineHeight;

    // Candidates, in preference order: right and left at the bubble edge, then
    // pushed progressively further out, then above/below.
    const candidates: Array<{ x: number; y: number; anchor: "start" | "end" }> = [];
    for (const dist of [t.r + GAP, t.r + GAP + 12, t.r + GAP + 26]) {
      candidates.push({ x: t.cx + dist, y: t.cy, anchor: "start" });
      candidates.push({ x: t.cx - dist, y: t.cy, anchor: "end" });
    }
    for (const dy of [-1, 1]) {
      for (const dist of [t.r + GAP, t.r + GAP + 14]) {
        candidates.push({ x: t.cx + dist, y: t.cy + dy * dist * 0.7, anchor: "start" });
        candidates.push({ x: t.cx - dist, y: t.cy + dy * dist * 0.7, anchor: "end" });
      }
      candidates.push({ x: t.cx, y: t.cy + dy * (t.r + GAP + lineHeight), anchor: "start" });
    }

    let chosen: { x: number; y: number; anchor: "start" | "end" } | null = null;

    for (const c of candidates) {
      const rect: Rect =
        c.anchor === "start"
          ? { x: c.x, y: c.y - h / 2, w, h }
          : { x: c.x - w, y: c.y - h / 2, w, h };

      // Must stay inside the plot area.
      if (
        rect.x < bounds.left ||
        rect.x + rect.w > bounds.left + bounds.width ||
        rect.y < bounds.top ||
        rect.y + rect.h > bounds.top + bounds.height
      ) {
        continue;
      }
      if (obstacles.some((o) => overlaps(rect, o))) continue;
      if (placedRects.some((p) => overlaps(rect, p))) continue;

      chosen = c;
      placedRects.push(rect);
      break;
    }

    if (!chosen) continue; // nowhere clear — drop it rather than overlap

    // Leader line only when the label sits clear of the bubble edge.
    const edgeX = chosen.anchor === "start" ? t.cx + t.r : t.cx - t.r;
    const needsLine = Math.abs(chosen.y - t.cy) > 2 || Math.abs(chosen.x - edgeX) > GAP + 2;

    placed.push({
      x: chosen.x,
      y: chosen.y,
      text: t.text,
      fill: t.fill,
      anchor: chosen.anchor,
      line: needsLine
        ? {
            x1: edgeX,
            y1: t.cy,
            x2: chosen.anchor === "start" ? chosen.x - 2 : chosen.x + 2,
            y2: chosen.y,
          }
        : null,
    });
  }

  return placed;
}
