import { prisma } from "@/lib/prisma";
import type { CourseCard } from "@/lib/types";
import { featuredCourses, defaultServices } from "@/lib/utils/site-data";

export async function getPublishedCourses(): Promise<CourseCard[]> {
  try {
    const courses = await prisma.course.findMany({
      where: { is_published: true },
      orderBy: [{ is_featured: "desc" }, { launch_date: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        thumbnail_url: true,
        price_cents: true,
        currency: true,
        difficulty: true,
        category: true,
        tags: true,
        total_duration_minutes: true,
        total_lessons: true,
        is_published: true,
        is_featured: true,
      },
    });

    if (courses.length > 0) return courses as CourseCard[];
  } catch {
    // fallback to static data
  }

  return featuredCourses.map((course, index) => ({
    id: `00000000-0000-0000-0000-00000000000${index + 1}`,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.subtitle,
    thumbnail_url: null,
    price_cents: Number(course.price.replace("$", "")) * 100,
    currency: "USD",
    difficulty: "intermediate",
    category: "fullstack",
    tags: course.tags,
    total_duration_minutes: 60,
    total_lessons: course.lessons,
    is_published: true,
    is_featured: true,
  }));
}

export async function getCourseBySlug(slug: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
    });

    if (!course) return null;

    const modules = await prisma.module.findMany({
      where: { course_id: course.id },
      orderBy: { sort_order: "asc" },
      include: {
        lessons: {
          orderBy: { sort_order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            duration_minutes: true,
            is_free_preview: true,
            sort_order: true,
          },
        },
      },
    });

    return { ...course, modules };
  } catch {
    const item = featuredCourses.find((course) => course.slug === slug);
    if (!item) return null;

    return {
      id: "00000000-0000-0000-0000-000000000001",
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      description: item.subtitle,
      long_description: item.subtitle,
      thumbnail_url: null as string | null,
      preview_video_url: null as string | null,
      price_cents: Number(item.price.replace("$", "")) * 100,
      currency: "USD",
      modules: [
        {
          id: "00000000-0000-0000-0000-000000000101",
          title: "Modulo de ejemplo",
          lessons: [
            { id: "00000000-0000-0000-0000-000000000201", title: "Leccion demo 1" },
            { id: "00000000-0000-0000-0000-000000000202", title: "Leccion demo 2" },
          ],
        },
      ],
    };
  }
}

export async function getActiveServices() {
  try {
    const services = await prisma.service.findMany({
      where: { is_active: true },
      orderBy: { sort_order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        short_description: true,
        long_description: true,
        price_range: true,
        is_featured: true,
        is_active: true,
      },
    });

    if (services.length > 0) return services;
  } catch {
    // fallback
  }

  return defaultServices.map((service, index) => ({
    id: `10000000-0000-0000-0000-00000000000${index + 1}`,
    slug: service.slug,
    title: service.title,
    short_description: service.description,
    long_description: service.description,
    price_range: service.price,
    is_featured: index < 2,
    is_active: true,
  }));
}

export async function getFeaturedTestimonials() {
  try {
    return await prisma.testimonial.findMany({
      where: { is_published: true },
      orderBy: [{ is_featured: "desc" }, { sort_order: "asc" }],
      take: 12,
      select: {
        id: true,
        author_name: true,
        author_role: true,
        content: true,
        rating: true,
      },
    });
  } catch {
    return [];
  }
}
