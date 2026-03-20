import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { guideCatalog } from "@/lib/guides/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://prolevelcode.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cursos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/planes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/guias`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/sobre-mi`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic course pages from database
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { is_published: true },
      select: { slug: true, updated_at: true },
    });
    coursePages = courses.map((course) => ({
      url: `${baseUrl}/cursos/${course.slug}`,
      lastModified: course.updated_at ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {}

  // Guide pages from catalog
  const guidePages: MetadataRoute.Sitemap = guideCatalog.flatMap((phase) =>
    phase.guides.map((guide) => ({
      url: `${baseUrl}/guias/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  return [...staticPages, ...coursePages, ...guidePages];
}
