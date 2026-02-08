import { Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { checkoutCourseSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { getBaseUrl } from "@/lib/payments/helpers";
import { convertUsdToCLP } from "@/lib/payments/currency";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return jsonError("Unauthorized", 401);

  const raw = await parseRequestBody<{ courseId?: string }>(request);
  const parsed = checkoutCourseSchema.safeParse({
    courseId: raw.courseId,
  });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, is_published: true },
    select: { id: true, slug: true, title: true, price_cents: true, currency: true },
  });

  if (!course) {
    return jsonError("Course not found", 404);
  }

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { user_id: context.user.id, course_id: course.id, status: "active" },
  });

  if (existingEnrollment) {
    const baseUrl = getBaseUrl();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(`${baseUrl}/dashboard/cursos/${course.slug}`, 303);
    }
    return jsonError("Course already purchased", 409);
  }

  // Free courses: enroll directly without payment
  if (course.price_cents === 0) {
    await prisma.enrollment.create({
      data: { user_id: context.user.id, course_id: course.id, amount_paid_cents: 0, currency: course.currency, status: "active" },
    });
    const baseUrl = getBaseUrl();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(`${baseUrl}/dashboard/cursos/${course.slug}?checkout=success`, 303);
    }
    return NextResponse.json({ url: `/dashboard/cursos/${course.slug}?checkout=success` });
  }

  let initPoint: string;

  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);
    const baseUrl = getBaseUrl();
    const localAmount = convertUsdToCLP(course.price_cents);

    const externalReference = JSON.stringify({
      type: "course",
      user_id: context.user.id,
      course_id: course.id,
    });

    // Only include notification_url if not localhost (MercadoPago rejects non-public URLs)
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

    const result = await preference.create({
      body: {
        items: [
          {
            id: course.id,
            title: course.title,
            quantity: 1,
            unit_price: localAmount,
          },
        ],
        payer: {
          email: context.user.email ?? undefined,
        },
        back_urls: {
          success: `${baseUrl}/dashboard/cursos/${course.slug}?checkout=success`,
          failure: `${baseUrl}/cursos/${course.slug}?checkout=failure`,
          pending: `${baseUrl}/cursos/${course.slug}?checkout=pending`,
        },
        auto_return: "approved",
        ...(isLocalhost ? {} : { notification_url: `${baseUrl}/api/webhook/mercadopago` }),
        external_reference: externalReference,
        statement_descriptor: "PROLEVELCODE",
      },
    });

    if (!result.init_point) {
      throw new Error("MercadoPago did not return init_point");
    }

    initPoint = result.init_point;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout/course] MercadoPago error:", errMsg, err);
    const baseUrl = getBaseUrl();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(`${baseUrl}/cursos/${course.slug}?checkout=error&detail=${encodeURIComponent(errMsg.slice(0, 200))}`, 303);
    }
    return jsonError("Payment service unavailable", 503, { detail: errMsg });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return NextResponse.redirect(initPoint, 303);
  }

  return NextResponse.json({ url: initPoint });
}
