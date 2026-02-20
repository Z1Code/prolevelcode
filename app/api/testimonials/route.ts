import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
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

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { rating, content } = body as { rating: unknown; content: unknown };

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
  }
  if (typeof content !== "string" || content.trim().length === 0 || content.length > 500) {
    return NextResponse.json({ error: "Contenido requerido (máx 500 caracteres)" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { full_name: true, email: true },
  });

  await prisma.testimonial.create({
    data: {
      user_id: user.id,
      author_name: dbUser?.full_name || dbUser?.email?.split("@")[0] || "Estudiante",
      content: content.trim(),
      rating,
      is_published: false,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
