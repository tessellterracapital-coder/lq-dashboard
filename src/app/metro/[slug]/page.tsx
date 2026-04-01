import type { Metadata } from "next";
import { METROS } from "@/data/metros";
import MetroPageClient from "./MetroPageClient";

interface MetroPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: MetroPageProps): Promise<Metadata> {
  const metro = METROS.find((m) => m.slug === params.slug);

  if (!metro) {
    return { title: "Metro Not Found | MetroLQ" };
  }

  return {
    title: `${metro.name} Location Quotient Analysis | MetroLQ`,
    description: `Economic base analysis for ${metro.name}. See which industries drive the local economy with location quotient data from the Bureau of Labor Statistics.`,
    openGraph: {
      title: `${metro.name} Location Quotient Analysis`,
      description: `Economic base analysis for ${metro.name}. Identify export sectors, assess concentration risk, and understand economic drivers.`,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return METROS.map((m) => ({ slug: m.slug }));
}

export default function MetroPage({ params }: MetroPageProps) {
  const metro = METROS.find((m) => m.slug === params.slug);

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
