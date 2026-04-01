"use client";

import { useCallback, useRef, type RefObject } from "react";

interface ExportButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
  filename?: string;
}

export default function ExportButton({ targetRef, filename = "metrolq-chart" }: ExportButtonProps) {
  const exporting = useRef(false);

  const handleExport = useCallback(async () => {
    if (exporting.current || !targetRef.current) return;
    exporting.current = true;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#0f1117",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      exporting.current = false;
    }
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#1a1d27] border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
      title="Download chart as PNG"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export PNG
    </button>
  );
}
