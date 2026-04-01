import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Metro Areas Side by Side | MetroLQ",
  description:
    "Compare 2\u20133 U.S. metro areas side by side. See grouped LQ bar charts, summary tables, and the biggest economic differences between regions.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
