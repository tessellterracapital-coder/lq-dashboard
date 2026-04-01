import { type LQResult } from "./blsApi";

/**
 * Compute a Herfindahl-Hirschman Index (HHI) from sector employment shares,
 * then map it to a letter grade A–F for diversification.
 *
 * HHI = sum of squared employment shares (as decimals).
 * With 10 equal sectors, HHI = 10 * (0.1)^2 = 0.10 (most diversified).
 * With 1 dominant sector at 100%, HHI = 1.0 (most concentrated).
 */
export function computeHHI(results: LQResult[]): number {
  const withData = results.filter((r) => r.hasData && r.localPctOfTotal > 0);
  if (withData.length === 0) return 0;

  const totalPct = withData.reduce((sum, r) => sum + r.localPctOfTotal, 0);
  if (totalPct === 0) return 0;

  return withData.reduce((sum, r) => {
    const share = r.localPctOfTotal / totalPct;
    return sum + share * share;
  }, 0);
}

export type DiversificationGrade = "A" | "B" | "C" | "D" | "F";

export function getGrade(hhi: number): DiversificationGrade {
  // Thresholds calibrated for 10 supersectors:
  // Perfect equal = 0.10, typical metro = 0.12–0.18, concentrated = 0.20+
  if (hhi <= 0.12) return "A";
  if (hhi <= 0.15) return "B";
  if (hhi <= 0.18) return "C";
  if (hhi <= 0.22) return "D";
  return "F";
}

export function getGradeColor(grade: DiversificationGrade): string {
  switch (grade) {
    case "A": return "text-green-400";
    case "B": return "text-blue-400";
    case "C": return "text-yellow-400";
    case "D": return "text-orange-400";
    case "F": return "text-red-400";
  }
}

export function getGradeLabel(grade: DiversificationGrade): string {
  switch (grade) {
    case "A": return "Highly Diversified";
    case "B": return "Diversified";
    case "C": return "Moderately Concentrated";
    case "D": return "Concentrated";
    case "F": return "Highly Concentrated";
  }
}
