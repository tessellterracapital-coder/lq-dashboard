"use client";

import { useEffect, useState } from "react";
import { loadScreeningData, type ScreeningMetro } from "@/lib/screeningData";
import { METROS } from "@/data/metros";
import { type LQResult } from "@/lib/blsApi";
import { SUPERSECTORS } from "@/data/supersectors";

interface SimilarMetrosProps {
  currentSlug: string;
  currentStateCode: string;
  currentAreaCode: string;
  results: LQResult[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildLQVector(lqMap: Record<string, number>): number[] {
  return SUPERSECTORS.map((s) => lqMap[s.code] ?? 0);
}

export default function SimilarMetros({ currentSlug, currentStateCode, currentAreaCode, results }: SimilarMetrosProps) {
  const [similar, setSimilar] = useState<Array<{ metro: ScreeningMetro; score: number; knownSlug: string | null }>>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      try {
        const data = await loadScreeningData();

        // Build current metro's LQ vector from live results
        const currentLQ: Record<string, number> = {};
        for (const r of results) {
          if (r.hasData) currentLQ[r.supersectorCode] = r.lq;
        }
        const currentVec = buildLQVector(currentLQ);

        // Score all other metros
        const scored = data.metros
          .filter((m) => !(m.stateCode === currentStateCode && m.areaCode === currentAreaCode))
          .map((m) => {
            const vec = buildLQVector(m.lq);
            const score = cosineSimilarity(currentVec, vec);
            const known = METROS.find(
              (km) => km.stateCode === m.stateCode && km.areaCode === m.areaCode
            );
            return { metro: m, score, knownSlug: known?.slug ?? null };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (!cancelled) {
          setSimilar(scored);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }

    if (results.length > 0) compute();
    return () => { cancelled = true; };
  }, [currentSlug, currentStateCode, currentAreaCode, results]);

  if (!loaded || similar.length === 0) return null;

  return (
    <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Similar Metros</div>
      <div className="space-y-2">
        {similar.map(({ metro, score, knownSlug }) => (
          <a
            key={`${metro.stateCode}-${metro.areaCode}`}
            href={`/metro/${knownSlug ?? metro.slug}`}
            className="flex items-center justify-between py-2 px-3 rounded hover:bg-[#252836] transition-colors group"
          >
            <div>
              <span className="text-sm text-gray-200 group-hover:text-blue-400 transition-colors">
                {metro.name}
              </span>
              <span className="text-xs text-gray-600 ml-2">
                Top: {metro.topExportSector} ({metro.topExportLQ.toFixed(2)})
              </span>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {(score * 100).toFixed(0)}% match
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
