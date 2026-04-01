"use client";

interface AdPlaceholderProps {
  /** "leaderboard" (728x90), "banner" (320x50), "rectangle" (300x250) */
  format: "leaderboard" | "banner" | "rectangle";
  className?: string;
}

const SIZES = {
  leaderboard: { w: 728, h: 90 },
  banner: { w: 320, h: 50 },
  rectangle: { w: 300, h: 250 },
};

export default function AdPlaceholder({ format, className = "" }: AdPlaceholderProps) {
  const { w, h } = SIZES[format];

  return (
    <div
      className={`flex items-center justify-center border border-dashed border-gray-800 rounded text-gray-700 text-xs mx-auto ${className}`}
      style={{ width: w, maxWidth: "100%", height: h }}
      role="complementary"
      aria-label="Advertisement"
      data-ad-format={format}
    >
      Ad {w}&times;{h}
    </div>
  );
}
