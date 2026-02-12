"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

/* ─────────────── helpers ─────────────── */

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? "";
}

function int(fd: FormData, key: string, fallback = 0): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? Math.round(v) : fallback;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ─────────────── COURSES ─────────────── */

export async function createCourse(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const title = str(fd, "title");
  const slug = str(fd, "slug") || slugify(title);
  const subtitle = str(fd, "subtitle") || null;
  const description = str(fd, "description") || null;
  const price_dollars = Number(fd.get("price_dollars")) || 0;
  const price_cents = Math.round(price_dollars * 100);
  const currency = str(fd, "currency") || "USD";
  const difficulty = str(fd, "difficulty") || null;
  const category = str(fd, "category") || null;
  const preview_video_url = str(fd, "preview_video_url") || null;
  const is_published = bool(fd, "is_published");
  const is_featured = bool(fd, "is_featured");
  const is_coming_soon = bool(fd, "is_coming_soon");
  const tier_access = str(fd, "tier_access") || "basic";

  if (!title) redirect("/admin/cursos/new?error=titulo-requerido");

  const course = await prisma.course.create({
    data: { title, slug, subtitle, description, price_cents, currency, difficulty, category, preview_video_url, is_published, is_featured, is_coming_soon, tier_access },
  });

  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${course.id}`);
}

export async function updateCourse(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const title = str(fd, "title");
  const slug = str(fd, "slug") || slugify(title);
  const subtitle = str(fd, "subtitle") || null;
  const description = str(fd, "description") || null;
  const price_dollars = Number(fd.get("price_dollars")) || 0;
  const price_cents = Math.round(price_dollars * 100);
  const currency = str(fd, "currency") || "USD";
  const difficulty = str(fd, "difficulty") || null;
  const category = str(fd, "category") || null;
  const preview_video_url = str(fd, "preview_video_url") || null;
  const is_published = bool(fd, "is_published");
  const is_featured = bool(fd, "is_featured");
  const is_coming_soon = bool(fd, "is_coming_soon");
  const tier_access = str(fd, "tier_access") || "basic";

  if (!id || !title) redirect(`/admin/cursos/${id}/editar?error=titulo-requerido`);

  await prisma.course.update({
    where: { id },
    data: { title, slug, subtitle, description, price_cents, currency, difficulty, category, preview_video_url, is_published, is_featured, is_coming_soon, tier_access },
  });

  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${id}`);
  redirect(`/admin/cursos/${id}`);
}

export async function deleteCourse(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}

/* ─────────────── MODULES ─────────────── */

export async function createModule(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const course_id = str(fd, "course_id");
  const title = str(fd, "title");

  if (!title) {
    revalidatePath(`/admin/cursos/${course_id}`);
    return;
  }

  const maxOrder = await prisma.module.aggregate({
    where: { course_id },
    _max: { sort_order: true },
  });

  await prisma.module.create({
    data: { course_id, title, sort_order: (maxOrder._max.sort_order ?? 0) + 1 },
  });

  revalidatePath(`/admin/cursos/${course_id}`);
}

export async function updateModule(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  const title = str(fd, "title");

  if (!title) {
    revalidatePath(`/admin/cursos/${course_id}`);
    return;
  }

  await prisma.module.update({ where: { id }, data: { title } });
  revalidatePath(`/admin/cursos/${course_id}`);
}

export async function deleteModule(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  await prisma.module.delete({ where: { id } });
  revalidatePath(`/admin/cursos/${course_id}`);
}

export async function reorderModule(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  const sort_order = int(fd, "sort_order");
  await prisma.module.update({ where: { id }, data: { sort_order } });
  revalidatePath(`/admin/cursos/${course_id}`);
}

/* ─────────────── LESSONS ─────────────── */

export async function createLesson(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const course_id = str(fd, "course_id");
  const module_id = str(fd, "module_id");
  const title = str(fd, "title");
  const bunny_video_id = str(fd, "bunny_video_id") || null;
  const youtube_video_id = str(fd, "youtube_video_id") || null;
  const duration_minutes = int(fd, "duration_minutes") || null;
  const is_free_preview = bool(fd, "is_free_preview");

  if (!title || (!bunny_video_id && !youtube_video_id)) {
    revalidatePath(`/admin/cursos/${course_id}/lecciones`);
    return;
  }

  const maxOrder = await prisma.lesson.aggregate({
    where: { course_id },
    _max: { sort_order: true },
  });

  await prisma.lesson.create({
    data: {
      course_id,
      module_id,
      title,
      bunny_video_id,
      youtube_video_id,
      duration_minutes,
      sort_order: (maxOrder._max.sort_order ?? 0) + 1,
      is_free_preview,
    },
  });

  // Update course total_lessons count
  const count = await prisma.lesson.count({ where: { course_id } });
  await prisma.course.update({ where: { id: course_id }, data: { total_lessons: count } });

  revalidatePath(`/admin/cursos/${course_id}/lecciones`);
}

export async function updateLesson(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  const module_id = str(fd, "module_id");
  const title = str(fd, "title");
  const bunny_video_id = str(fd, "bunny_video_id") || null;
  const youtube_video_id = str(fd, "youtube_video_id") || null;
  const duration_minutes = int(fd, "duration_minutes") || null;
  const is_free_preview = bool(fd, "is_free_preview");

  if (!title || (!bunny_video_id && !youtube_video_id)) {
    revalidatePath(`/admin/cursos/${course_id}/lecciones`);
    return;
  }

  await prisma.lesson.update({
    where: { id },
    data: { module_id, title, bunny_video_id, youtube_video_id, duration_minutes, is_free_preview },
  });

  revalidatePath(`/admin/cursos/${course_id}/lecciones`);
}

export async function deleteLesson(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  await prisma.lesson.delete({ where: { id } });

  const count = await prisma.lesson.count({ where: { course_id } });
  await prisma.course.update({ where: { id: course_id }, data: { total_lessons: count } });

  revalidatePath(`/admin/cursos/${course_id}/lecciones`);
}

/* ─────────────── CRYPTO PAYMENTS ─────────────── */

export async function approveCryptoPayment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  const { fulfillCryptoPayment } = await import("@/lib/crypto/fulfill");

  const payment = await prisma.cryptoPayment.findUnique({ where: { id } });
  if (!payment || payment.status === "completed") {
    revalidatePath("/admin/pagos");
    return;
  }

  await prisma.cryptoPayment.update({
    where: { id },
    data: {
      status: "completed",
      tx_hash: "manual_admin_approval",
      completed_at: new Date(),
    },
  });

  await fulfillCryptoPayment(payment);
  revalidatePath("/admin/pagos");
}

export async function rejectCryptoPayment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  await prisma.cryptoPayment.update({
    where: { id },
    data: { status: "expired" },
  });

  revalidatePath("/admin/pagos");
}

/* ─────────────── ENROLLMENTS ─────────────── */

export async function createEnrollment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const user_email = str(fd, "user_email");
  const course_id = str(fd, "course_id");

  if (!user_email || !course_id) {
    revalidatePath("/admin/matriculas");
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: user_email } });
  if (!user) {
    redirect("/admin/matriculas?error=usuario-no-encontrado");
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: user.id, course_id } },
  });

  if (existing) {
    redirect("/admin/matriculas?error=ya-matriculado");
  }

  await prisma.enrollment.create({
    data: { user_id: user.id, course_id, amount_paid_cents: 0, status: "active" },
  });

  revalidatePath("/admin/matriculas");
}

export async function deleteEnrollment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  await prisma.enrollment.delete({ where: { id } });
  revalidatePath("/admin/matriculas");
}

/* ─────────────── PRO QUERIES ─────────────── */

export async function answerProQuery(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const answer = str(fd, "answer");

  if (!id || !answer) return;

  await prisma.proQuery.update({
    where: { id },
    data: {
      answer,
      status: "answered",
      answered_at: new Date(),
    },
  });

  revalidatePath("/admin/consultas");
}
