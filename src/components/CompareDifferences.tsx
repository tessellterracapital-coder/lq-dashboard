"use client";

import { type MetroLQData } from "@/lib/useMultiLQData";
import { SUPERSECTORS } from "@/data/supersectors";

interface CompareDifferencesProps {
  metros: MetroLQData[];
}

function shortenMetroName(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split("-")[0].split(",")[0].trim();
}

interface DiffEntry {
  sector: string;
  highMetro: string;
  lowMetro: string;
  highLQ: number;
  lowLQ: number;
  diff: number;
}

export default function CompareDifferences({ metros }: CompareDifferencesProps) {
  if (metros.length < 2) return null;

  const diffs: DiffEntry[] = [];

  for (const sector of SUPERSECTORS) {
    const entries = metros
      .map((m) => {
        const r = m.lqResults.find((r) => r.supersectorCode === sector.code);
        return r?.hasData ? { name: shortenMetroName(m.metroName), lq: r.lq } : null;
      })
      .filter((e): e is { name: string; lq: number } => e !== null);

    if (entries.length < 2) continue;

    entries.sort((a, b) => b.lq - a.lq);
    const diff = entries[0].lq - entries[entries.length - 1].lq;

    if (diff >= 0.2) {
      diffs.push({
        sector: sector.label,
        highMetro: entries[0].name,
        lowMetro: entries[entries.length - 1].name,
        highLQ: entries[0].lq,
        lowLQ: entries[entries.length - 1].lq,
        diff,
      });
    }
  }

  diffs.sort((a, b) => b.diff - a.diff);

  if (diffs.length === 0) return null;

  return (
    <div className="bg-[#1a1d27] rounded-lg p-6 border border-gray-800">
      <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
        Biggest LQ Differences
      </h3>
      <div className="space-y-3">
        {diffs.slice(0, 5).map((d) => (
          <div
            key={d.sector}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-gray-800/50 last:border-0"
          >
            <span className="text-gray-200 font-medium sm:w-52 shrink-0">{d.sector}</span>
            <div className="flex items-center gap-2 text-sm flex-1">
              <span className="text-blue-400 font-mono">{d.highLQ.toFixed(2)}</span>
              <span className="text-gray-600">{d.highMetro}</span>
              <span className="text-gray-600">vs</span>
              <span className="text-gray-400 font-mono">{d.lowLQ.toFixed(2)}</span>
              <span className="text-gray-600">{d.lowMetro}</span>
              <span className="ml-auto text-yellow-400 font-mono font-bold">
                +{d.diff.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
