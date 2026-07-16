import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { METROS } from "@/data/metros";

function getAllMetroSlugs(): string[] {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "lq_all_metros.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as { metros: { slug: string }[] };
    const slugs = new Set(data.metros.map((m) => m.slug));
    // Include curated slugs (e.g. "arlington-nova") that may differ from auto-generated ones
    METROS.forEach((m) => slugs.add(m.slug));
    return Array.from(slugs);
  } catch {
    // Fall back to curated list if JSON isn't available
    return METROS.map((m) => m.slug);
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
