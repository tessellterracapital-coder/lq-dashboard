import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import fs from "fs";
import path from "path";
import { canonicalSlug } from "@/data/legacyMetroSlugs";
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

/** Resolve from the BLS-built dataset — the single source of metro identity. */
function findMetro(slug: string): ScreeningMetro | undefined {
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

/** Generate static pages for every metro in the screening JSON. */
export function generateStaticParams() {
  return getAllScreeningMetros().map((m) => ({ slug: m.slug }));
}

export default function MetroPage({ params }: MetroPageProps) {
  // Legacy curated slugs (e.g. /metro/atlanta-ga) were published in the sitemap
  // and linked from the screening table, so they redirect to the canonical slug
  // rather than 404. Permanent (308) so search engines consolidate ranking onto
  // the canonical URL instead of treating both as live duplicates.
  const canonical = canonicalSlug(params.slug);
  if (canonical) permanentRedirect(`/metro/${canonical}`);

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
