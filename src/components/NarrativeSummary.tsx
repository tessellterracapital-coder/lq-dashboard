"use client";

import { type LQResult } from "@/lib/blsApi";
import { type TrendResult } from "@/lib/blsApi";
import { computeHHI, getGrade, getGradeLabel } from "@/lib/concentrationScore";

interface NarrativeSummaryProps {
  metroName: string;
  results: LQResult[];
  trendData: TrendResult | null;
}

function computeGrowth(trendData: TrendResult, code: string): number | null {
  const series = trendData.series.find((s) => s.supersectorCode === code);
  if (!series || series.data.length < 2) return null;
  const sorted = [...series.data].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.employment === 0) return null;
  return ((last.employment - first.employment) / first.employment) * 100;
}

export default function NarrativeSummary({ metroName, results, trendData }: NarrativeSummaryProps) {
  const withData = results.filter((r) => r.hasData);
  if (withData.length === 0) return null;

  const sorted = [...withData].sort((a, b) => b.lq - a.lq);
  const topExport = sorted[0];
  const exportSectors = withData.filter((r) => r.lq >= 1.2);
  const hhi = computeHHI(results);
  const grade = getGrade(hhi);
  const gradeLabel = getGradeLabel(grade);

  // Find fastest growing and declining sectors from trend data
  let fastestGrowing: { label: string; growth: number } | null = null;
  let fastestDeclining: { label: string; growth: number } | null = null;

  if (trendData) {
    for (const r of withData) {
      const growth = computeGrowth(trendData, r.supersectorCode);
      if (growth === null) continue;
      if (!fastestGrowing || growth > fastestGrowing.growth) {
        fastestGrowing = { label: r.label, growth };
      }
      if (!fastestDeclining || growth < fastestDeclining.growth) {
        fastestDeclining = { label: r.label, growth };
      }
    }
  }

  // Build the short city name (first part before comma or dash)
  const shortName = metroName.split(",")[0].split("-")[0].trim();

  const sentences: string[] = [];

  // Sentence 1: Top export
  sentences.push(
    `${shortName}'s economy is driven by ${topExport.label} (LQ ${topExport.lq.toFixed(2)})${
      exportSectors.length > 1
        ? ` and ${exportSectors.length - 1} other export sector${exportSectors.length > 2 ? "s" : ""}`
        : ""
    }.`
  );

  // Sentence 2: Diversification
  sentences.push(
    `The metro has a${grade === "A" || grade === "F" ? "n" : ""} ${gradeLabel.toLowerCase()} economy (Grade ${grade}).`
  );

  // Sentence 3: Trends
  if (fastestGrowing && fastestDeclining && fastestGrowing.label !== fastestDeclining.label) {
    const parts: string[] = [];
    if (fastestGrowing.growth > 0) {
      parts.push(
        `${fastestGrowing.label} grew ${fastestGrowing.growth.toFixed(1)}%`
      );
    }
    if (fastestDeclining.growth < 0) {
      parts.push(
        `${fastestDeclining.label} declined ${Math.abs(fastestDeclining.growth).toFixed(1)}%`
      );
    }
    if (parts.length > 0) {
      sentences.push(`Over the past 10 years, ${parts.join(" while ")}.`);
    }
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Summary</div>
      <p className="text-sm text-gray-300 leading-relaxed">
        {sentences.join(" ")}
      </p>
    </div>
  );
}
