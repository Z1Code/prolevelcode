import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { CourseCard } from "@/lib/types";
import { featuredCourses, defaultServices } from "@/lib/utils/site-data";

export async function getPublishedCourses(): Promise<CourseCard[]> {
  if (!env.firebaseAdminProjectId) {
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

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("courses")
    .select("id,slug,title,subtitle,description,thumbnail_url,price_cents,currency,difficulty,category,tags,total_duration_minutes,total_lessons,is_published,is_featured")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("launch_date", { ascending: false });

  return (data ?? []) as CourseCard[];
}

export async function getCourseBySlug(slug: string) {
  if (!env.firebaseAdminProjectId) {
    const item = featuredCourses.find((course) => course.slug === slug);

    if (!item) {
      return null;
    }

    return {
      id: "00000000-0000-0000-0000-000000000001",
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      description: item.subtitle,
      long_description: item.subtitle,
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

  const supabase = createAdminSupabaseClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();

  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id,title,description,sort_order,lessons(id,title,description,duration_minutes,is_free_preview,sort_order)")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  return {
    ...course,
    modules: modules ?? [],
  };
}

export async function getActiveServices() {
  if (!env.firebaseAdminProjectId) {
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

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("services")
    .select("id,slug,title,short_description,long_description,price_range,is_featured,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getFeaturedTestimonials() {
  if (!env.firebaseAdminProjectId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id,author_name,author_role,content,rating")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(12);

  return data ?? [];
}


