import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

/**
 * Canonical slugs only. Legacy curated slugs are deliberately excluded — they
 * 308-redirect to these, and listing both would advertise duplicate URLs.
 */
function getAllMetroSlugs(): string[] {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "lq_all_metros.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as { metros: { slug: string }[] };
    return data.metros.map((m) => m.slug);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://metrolq.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/screen`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const metroPages: MetadataRoute.Sitemap = getAllMetroSlugs().map((slug) => ({
    url: `${baseUrl}/metro/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...metroPages];
}
