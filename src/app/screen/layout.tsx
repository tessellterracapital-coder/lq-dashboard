import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filter 400+ Metro Areas by LQ & Employment | MetroLQ",
  description:
    "Filter and rank 400+ U.S. metro areas by location quotient, employment size, and sector concentration. Find markets matching your criteria.",
};

export default function ScreenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
