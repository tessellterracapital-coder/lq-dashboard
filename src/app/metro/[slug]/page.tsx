import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { METROS } from "@/data/metros";
import MetroPageClient from "./MetroPageClient";

interface MetroPageProps {
  params: { slug: string };
}

interface ScreeningMetro {
  stateCode: string;
  areaCode: string;
  name: string;
  slug: string;
  areaType: string;
  totalEmployment: number;
  topExportSector?: string;
  topExportLQ?: number;
  exportCount?: number;
}

/** Read all 431 metros from the pre-built screening JSON at build time (server only). */
function getAllScreeningMetros(): ScreeningMetro[] {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "lq_all_metros.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return (JSON.parse(raw) as { metros: ScreeningMetro[] }).metros;
  } catch {
    return [];
  }
}

function findMetro(slug: string): ScreeningMetro | undefined {
  // Check curated list first (preserves hand-crafted slugs like "arlington-nova")
  const curated = METROS.find((m) => m.slug === slug);
  if (curated) return curated as ScreeningMetro;
  // Fall back to the full screening dataset
  return getAllScreeningMetros().find((m) => m.slug === slug);
}

export async function generateMetadata({ params }: MetroPageProps): Promise<Metadata> {
  const metro = findMetro(params.slug);

  if (!metro) {
    return { title: "Metro Not Found | MetroLQ" };
  }

  const baseDescription = metro.topExportSector && metro.topExportLQ
    ? `Economic base analysis for ${metro.name}. Top export sector: ${metro.topExportSector} (LQ ${metro.topExportLQ.toFixed(2)}). Explore all industries driving the local economy with BLS location quotient data.`
    : `Economic base analysis for ${metro.name}. See which industries drive the local economy with location quotient data from the Bureau of Labor Statistics.`;

  return {
    title: `${metro.name} Location Quotient Analysis | MetroLQ`,
    description: baseDescription,
    openGraph: {
      title: `${metro.name} Location Quotient Analysis`,
      description: `Economic base analysis for ${metro.name}. Identify export sectors, assess concentration risk, and understand economic drivers.`,
      type: "website",
    },
  };
}

/** Generate static pages for all 431 metros from the screening JSON, plus curated slugs. */
export function generateStaticParams() {
  const screeningSlugs = new Set(getAllScreeningMetros().map((m) => m.slug));
  // Merge curated slugs so hand-crafted slugs (e.g. "arlington-nova") are always included
  METROS.forEach((m) => screeningSlugs.add(m.slug));
  return Array.from(screeningSlugs).map((slug) => ({ slug }));
}

export default function MetroPage({ params }: MetroPageProps) {
  const metro = findMetro(params.slug);

  // JSON-LD structured data for SEO
  const jsonLd = metro
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `${metro.name} Location Quotient Data`,
        description: `Industry employment location quotient analysis for the ${metro.name} metropolitan area, computed from Bureau of Labor Statistics CES data.`,
        url: `https://metrolq.com/metro/${metro.slug}`,
        creator: {
          "@type": "Organization",
          name: "MetroLQ",
        },
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/html",
        },
        spatialCoverage: {
          "@type": "Place",
          name: metro.name,
        },
        temporalCoverage: "2015/..",
        isBasedOn: {
          "@type": "Dataset",
          name: "Bureau of Labor Statistics Current Employment Statistics",
          url: "https://www.bls.gov/ces/",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MetroPageClient />
    </>
  );
}
