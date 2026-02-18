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
  const difficulty = str(fd, "difficulty") || null;
  const category = str(fd, "category") || null;
  const preview_video_url = str(fd, "preview_video_url") || null;
  const is_published = bool(fd, "is_published");
  const is_featured = bool(fd, "is_featured");
  const is_coming_soon = bool(fd, "is_coming_soon");
  const tier_access = str(fd, "tier_access") || "basic";

  if (!title) redirect("/admin/cursos/new?error=titulo-requerido");

  const course = await prisma.course.create({
    data: { title, slug, subtitle, description, price_cents: 0, currency: "USD", difficulty, category, preview_video_url, is_published, is_featured, is_coming_soon, tier_access },
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
    data: { title, slug, subtitle, description, difficulty, category, preview_video_url, is_published, is_featured, is_coming_soon, tier_access },
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
  const title = str(fd, "title");
  const bunny_video_id = str(fd, "bunny_video_id") || null;
  const duration_minutes = int(fd, "duration_minutes") || null;
  const is_free_preview = bool(fd, "is_free_preview");
  const is_pro_only = bool(fd, "is_pro_only");

  if (!title || !bunny_video_id) {
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
      title,
      bunny_video_id,
      duration_minutes,
      sort_order: (maxOrder._max.sort_order ?? 0) + 1,
      is_free_preview,
      is_pro_only,
    },
  });

  const count = await prisma.lesson.count({ where: { course_id } });
  await prisma.course.update({ where: { id: course_id }, data: { total_lessons: count } });

  revalidatePath(`/admin/cursos/${course_id}/lecciones`);
}

export async function updateLesson(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  const course_id = str(fd, "course_id");
  const title = str(fd, "title");
  const bunny_video_id = str(fd, "bunny_video_id") || null;
  const duration_minutes = int(fd, "duration_minutes") || null;
  const is_free_preview = bool(fd, "is_free_preview");
  const is_pro_only = bool(fd, "is_pro_only");

  if (!title || !bunny_video_id) {
    revalidatePath(`/admin/cursos/${course_id}/lecciones`);
    return;
  }

  await prisma.lesson.update({
    where: { id },
    data: { title, bunny_video_id, duration_minutes, is_free_preview, is_pro_only },
  });

  revalidatePath(`/admin/cursos/${course_id}/lecciones`);
}

export async function createLessonsBulk(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const course_id = str(fd, "course_id");
  const count = int(fd, "count");

  if (!course_id || count < 1) {
    revalidatePath(`/admin/cursos/${course_id}/lecciones`);
    return;
  }

  const maxOrder = await prisma.lesson.aggregate({
    where: { course_id },
    _max: { sort_order: true },
  });
  let nextOrder = (maxOrder._max.sort_order ?? 0) + 1;

  const lessons: {
    course_id: string;
    title: string;
    bunny_video_id: string;
    sort_order: number;
    is_pro_only: boolean;
  }[] = [];

  for (let i = 0; i < count; i++) {
    const title = str(fd, `title_${i}`);
    const bunny_video_id = str(fd, `bunny_video_id_${i}`);
    const is_pro_only = fd.get(`is_pro_only_${i}`) === "on";
    if (!title || !bunny_video_id) continue;
    lessons.push({ course_id, title, bunny_video_id, sort_order: nextOrder++, is_pro_only });
  }

  if (lessons.length === 0) {
    revalidatePath(`/admin/cursos/${course_id}/lecciones`);
    return;
  }

  await prisma.lesson.createMany({ data: lessons });

  const totalCount = await prisma.lesson.count({ where: { course_id } });
  await prisma.course.update({ where: { id: course_id }, data: { total_lessons: totalCount } });

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
    where: { id, status: "pending" },
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

/* ─────────────── PAYPAL PAYMENTS ─────────────── */

export async function approvePaypalPayment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  const now = new Date();

  // Atomically claim the payment (prevents double approval)
  let payment;
  try {
    payment = await prisma.paypalPayment.update({
      where: { id, status: "pending" },
      data: { status: "approved", approved_at: now },
      include: { user: { select: { email: true, full_name: true } } },
    });
  } catch {
    // Record not found or not pending — already approved/rejected
    revalidatePath("/admin/pagos");
    return;
  }

  // Check user doesn't already have an active tier
  const existingActive = await prisma.tierPurchase.findFirst({
    where: { user_id: payment.user_id, status: "active" },
  });
  if (existingActive) {
    revalidatePath("/admin/pagos");
    return;
  }

  // Create TierPurchase
  const tierPurchase = await prisma.tierPurchase.create({
    data: {
      user_id: payment.user_id,
      tier: payment.tier,
      status: "active",
      payment_provider: "paypal",
      payment_reference: payment.id,
      amount_paid_cents: payment.amount_usd_cents,
      currency: "USD",
    },
  });

  // Auto-create scholarship slot for Pro purchases
  if (payment.tier === "pro") {
    try {
      const { createScholarshipForProPurchase } = await import("@/lib/scholarships/helpers");
      await createScholarshipForProPurchase(payment.user_id, tierPurchase.id);
    } catch {
      // Don't block approval if scholarship creation fails
    }
  }

  // Send confirmation email to user
  try {
    const { getResendClient } = await import("@/lib/email/resend");
    const resend = getResendClient();
    const tierLabel = payment.tier === "pro" ? "Pro" : "Basic";
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.dev>",
      to: payment.user.email,
      subject: `Tu plan ${tierLabel} fue activado`,
      html: `
        <h2>Tu plan ${tierLabel} esta activo</h2>
        <p>Hola${payment.user.full_name ? ` ${payment.user.full_name}` : ""},</p>
        <p>Tu pago PayPal fue verificado y tu plan <strong>${tierLabel}</strong> ya esta disponible.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://prolevelcode.dev"}/cursos">Ir a mis cursos</a></p>
      `,
    });
  } catch {
    // silent
  }

  revalidatePath("/admin/pagos");
}

export async function rejectPaypalPayment(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  await prisma.paypalPayment.update({
    where: { id },
    data: { status: "rejected" },
  });

  revalidatePath("/admin/pagos");
}

export async function revokeTierPurchase(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  await prisma.tierPurchase.update({
    where: { id },
    data: { status: "refunded" },
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

/* ─────────────── SCHOLARSHIP ADMIN ─────────────── */

export async function adminAssignScholarship(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const scholarshipId = str(fd, "scholarship_id");
  const applicationId = str(fd, "application_id");

  if (!scholarshipId || !applicationId) return;

  const scholarship = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
  const application = await prisma.scholarshipApplication.findUnique({
    where: { id: applicationId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!scholarship || !application || scholarship.status !== "unassigned" || application.status !== "pending") {
    revalidatePath("/admin/becas");
    return;
  }

  // Determine if permanent
  const { isEarlyProScholarship } = await import("@/lib/scholarships/helpers");
  const isPermanent = await isEarlyProScholarship(scholarship.tier_purchase_id);
  const now = new Date();
  const expiresAt = isPermanent ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.scholarship.update({
      where: { id: scholarship.id },
      data: {
        status: "active",
        recipient_email: application.user.email,
        recipient_user_id: application.user.id,
        application_id: application.id,
        applicant_reason: application.reason,
        assigned_at: now,
        redeemed_at: now,
        expires_at: expiresAt,
      },
    }),
    prisma.scholarshipApplication.update({
      where: { id: application.id },
      data: { status: "approved", reviewed_at: now },
    }),
  ]);

  // Notify Pro user
  try {
    const { getResendClient } = await import("@/lib/email/resend");
    const { env } = await import("@/lib/env");
    const grantor = await prisma.user.findUnique({
      where: { id: scholarship.grantor_id },
      select: { email: true },
    });
    if (grantor?.email) {
      const resend = getResendClient();
      await resend.emails.send({
        from: "ProLevelCode <no-reply@prolevelcode.dev>",
        to: grantor.email,
        subject: `Tu beca ${scholarship.scholarship_code} fue asignada`,
        html: `
          <h2>Tu beca fue asignada</h2>
          <p>Codigo: <strong>${scholarship.scholarship_code}</strong></p>
          <p>Asignada a: <strong>${application.user.email}</strong></p>
          <p>Su mensaje:</p>
          <blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;">${application.reason}</blockquote>
          <p><a href="${env.appUrl}/dashboard/beca">Ver mis becas</a></p>
        `,
      });
    }
  } catch {
    // silent
  }

  revalidatePath("/admin/becas");
}

export async function adminGrantScholarshipDirect(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  const app = await prisma.scholarshipApplication.findUnique({
    where: { id },
    select: { user_id: true, status: true },
  });
  if (!app || app.status !== "pending") return;

  // Check if user already has active Basic or higher
  const existing = await prisma.tierPurchase.findFirst({
    where: { user_id: app.user_id, tier: { in: ["basic", "pro"] }, status: "active" },
  });

  await prisma.$transaction([
    // Mark application as approved
    prisma.scholarshipApplication.update({
      where: { id },
      data: { status: "approved", reviewed_at: new Date() },
    }),
    // Grant Basic tier at $0 (admin grant — not counted as revenue)
    ...(existing
      ? []
      : [
          prisma.tierPurchase.create({
            data: {
              user_id: app.user_id,
              tier: "basic",
              status: "active",
              payment_provider: "admin_grant",
              payment_reference: "Beca aprobada por admin",
              amount_paid_cents: 0,
              currency: "USD",
            },
          }),
        ]),
  ]);

  revalidatePath("/admin/becas");
}

export async function adminRejectApplication(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  await prisma.scholarshipApplication.update({
    where: { id },
    data: { status: "rejected", reviewed_at: new Date() },
  });

  revalidatePath("/admin/becas");
}

/* ─────────────── SCHOLARSHIP EMAIL BLAST ─────────────── */

export async function sendScholarshipWelcomeEmails() {
  await requireRole(["admin", "superadmin"]);

  const { getResendClient } = await import("@/lib/email/resend");
  const { env } = await import("@/lib/env");
  const resend = getResendClient();

  // Find all active scholarship recipients with email
  const activeScholarships = await prisma.scholarship.findMany({
    where: {
      status: "active",
      recipient_user_id: { not: null },
    },
    select: {
      recipient_email: true,
      scholarship_code: true,
      recipient: { select: { email: true, full_name: true } },
    },
  });

  // Also find users who got Basic via admin_grant (beca directa)
  const adminGranted = await prisma.tierPurchase.findMany({
    where: {
      payment_provider: "admin_grant",
      status: "active",
      payment_reference: { contains: "Beca" },
    },
    select: {
      user: { select: { email: true, full_name: true } },
    },
  });

  // Collect unique emails
  const emailSet = new Map<string, string>();
  for (const s of activeScholarships) {
    const email = s.recipient?.email ?? s.recipient_email;
    const name = s.recipient?.full_name ?? null;
    if (email) emailSet.set(email, name ?? "");
  }
  for (const g of adminGranted) {
    if (g.user.email) emailSet.set(g.user.email, g.user.full_name ?? "");
  }

  const loginUrl = `${env.appUrl}/login`;
  const dashboardUrl = `${env.appUrl}/dashboard/cursos`;
  let sent = 0;

  for (const [email, name] of emailSet) {
    const greeting = name ? `Hola ${name.split(" ")[0]}` : "Hola";

    try {
      await resend.emails.send({
        from: "ProLevelCode <no-reply@prolevelcode.dev>",
        to: email,
        subject: "Tu beca en ProLevelCode esta lista — activa tu cuenta",
        html: `
          <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#e2e8f0;">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:40px 32px;border:1px solid rgba(148,163,184,0.15);">

              <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 8px;">
                ${greeting}, felicidades 🎉
              </h1>

              <p style="font-size:15px;color:#94a3b8;margin:0 0 24px;line-height:1.6;">
                Has recibido una <strong style="color:#34d399;">beca gratuita</strong> en ProLevelCode
                que te da acceso a nuestros cursos Basic.
              </p>

              <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:14px;color:#d1d5db;margin:0;line-height:1.7;">
                  Esta es una oportunidad real para aprender programacion, desarrollo web
                  y tecnologia de forma practica. Cada leccion esta pensada para que avances
                  paso a paso, a tu ritmo.
                </p>
              </div>

              <p style="font-size:14px;color:#94a3b8;margin:0 0 24px;line-height:1.6;">
                Creemos que el conocimiento transforma vidas. Aprovecha esta beca al maximo,
                dedica tiempo a cada leccion, practica los ejercicios y no dudes en comentar
                tus dudas dentro de la plataforma.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(120deg,#00ff88,#2dd4bf,#3b82f6);color:#04180f;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;">
                  Activar mi cuenta
                </a>
              </div>

              <p style="font-size:13px;color:#64748b;margin:0 0 8px;line-height:1.6;">
                Una vez dentro, ve directamente a
                <a href="${dashboardUrl}" style="color:#6366f1;text-decoration:underline;">Mis Cursos</a>
                y comienza a aprender.
              </p>

              <div style="border-top:1px solid rgba(148,163,184,0.12);margin-top:28px;padding-top:20px;">
                <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
                  💬 <strong style="color:#94a3b8;">Una ultima cosa:</strong> si conoces a alguien
                  que tambien quiera aprender — un companero de clase, un amigo, un familiar —
                  cuentale sobre ProLevelCode. Cuantos mas seamos, mejor aprendemos juntos.
                </p>
              </div>

              <p style="font-size:12px;color:#475569;margin:28px 0 0;text-align:center;">
                — El equipo de ProLevelCode
              </p>
            </div>
          </div>
        `,
      });
      sent++;
    } catch {
      // Continue with next email if one fails
    }

    // Small delay between emails to avoid rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  revalidatePath("/admin/becas");
  return sent;
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

/* ─────────────── REVIEWS ─────────────── */

export async function publishAsTestimonial(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const reviewId = str(fd, "review_id");
  if (!reviewId) return;

  const review = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { full_name: true } },
      course: { select: { title: true } },
    },
  });

  if (!review) {
    revalidatePath("/admin/resenas");
    return;
  }

  try {
    await prisma.testimonial.create({
      data: {
        author_name: review.user.full_name || "Estudiante",
        content: review.comment,
        rating: review.rating,
        service_or_course: review.course.title,
        is_published: true,
        is_featured: false,
      },
    });
  } catch (err) {
    console.error("[publishAsTestimonial] failed:", err);
  }

  revalidatePath("/admin/resenas");
}

export async function deleteReview(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const reviewId = str(fd, "review_id");
  const type = str(fd, "type");
  if (!reviewId) return;

  if (type === "lesson") {
    await prisma.lessonReview.delete({ where: { id: reviewId } });
  } else {
    await prisma.courseReview.delete({ where: { id: reviewId } });
  }

  revalidatePath("/admin/resenas");
}

/* ─────────────── USERS ─────────────── */

export async function deleteUser(fd: FormData) {
  await requireRole(["admin", "superadmin"]);
  const id = str(fd, "id");
  if (!id) return;

  // Prevent deleting admin/superadmin accounts
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return;
  if (user.role === "admin" || user.role === "superadmin") return;

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
}
