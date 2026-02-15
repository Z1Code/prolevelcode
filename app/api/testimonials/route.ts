import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testimonials as staticTestimonials } from "@/lib/utils/site-data";

export async function GET() {
  try {
    const dbTestimonials = await prisma.testimonial.findMany({
      where: { is_published: true },
      orderBy: [{ is_featured: "desc" }, { sort_order: "asc" }],
      take: 12,
      select: {
        author_name: true,
        author_role: true,
        content: true,
        rating: true,
      },
    });

    if (dbTestimonials.length > 0) {
      return NextResponse.json(
        dbTestimonials.map((t) => ({
          name: t.author_name,
          role: t.author_role || "Estudiante",
          content: t.content,
          rating: t.rating,
        })),
      );
    }
  } catch {
    // fallback
  }

  return NextResponse.json(
    staticTestimonials.map((t) => ({ ...t, rating: null })),
  );
}
