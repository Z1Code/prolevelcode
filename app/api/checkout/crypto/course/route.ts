import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { checkoutCourseSchema } from "@/lib/validators/api";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";
import { assertRateLimit } from "@/lib/utils/rate-limit";
import { generateUniqueAmount, CRYPTO_PAYMENT_EXPIRY_MINUTES } from "@/lib/crypto/config";

export async function POST(request: NextRequest) {
  const context = await requireApiUser();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const allowed = await assertRateLimit("checkout/crypto/course", context.user.id, 10, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const raw = await parseRequestBody<{ courseId?: string }>(request);
  const parsed = checkoutCourseSchema.safeParse({ courseId: raw.courseId });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, is_published: true },
    select: { id: true, slug: true, title: true, price_cents: true },
  });

  if (!course) {
    return jsonError("Course not found", 404);
  }

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { user_id: context.user.id, course_id: course.id, status: "active" },
  });

  if (existingEnrollment) {
    return jsonError("Course already purchased", 409);
  }

  const orderId = `PLC_CR_${nanoid(16)}`;
  const amountUsdt = generateUniqueAmount(course.price_cents);
  const expiresAt = new Date(Date.now() + CRYPTO_PAYMENT_EXPIRY_MINUTES * 60 * 1000);

  await prisma.cryptoPayment.create({
    data: {
      order_id: orderId,
      user_id: context.user.id,
      type: "course",
      target_id: course.id,
      amount_usdt: amountUsdt,
      status: "pending",
      expires_at: expiresAt,
    },
  });

  const baseUrl = request.nextUrl.origin;
  return NextResponse.json({
    url: `${baseUrl}/crypto/pay?order=${orderId}`,
  });
}
