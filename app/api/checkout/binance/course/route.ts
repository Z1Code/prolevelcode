import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { createBinanceOrder } from "@/lib/binance/client";
import { checkoutCourseSchema } from "@/lib/validators/api";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";
import { assertRateLimit } from "@/lib/utils/rate-limit";

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;

  if (!hasValidOrigin(request)) {
    return jsonError("Invalid origin", 403);
  }

  const context = await requireApiUser();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const allowed = await assertRateLimit("checkout/binance/course", context.user.id, 10, 60);
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

  const merchantTradeNo = `PLC_C_${nanoid(16)}`;
  const amountUsdt = (course.price_cents / 100).toFixed(2);

  try {
    const result = await createBinanceOrder({
      merchantTradeNo,
      totalAmount: amountUsdt,
      currency: "USDT",
      description: `Curso: ${course.title}`,
      returnUrl: `${baseUrl}/dashboard/cursos/${course.slug}?checkout=success`,
      cancelUrl: `${baseUrl}/cursos/${course.slug}?checkout=failure`,
      webhookUrl: `${baseUrl}/api/webhook/binance`,
      metadata: {
        type: "course",
        user_id: context.user.id,
        course_id: course.id,
      },
    });

    await prisma.binancePayment.create({
      data: {
        binance_order_id: result.data.prepayId,
        merchant_trade_no: merchantTradeNo,
        status: "INITIAL",
        amount: amountUsdt,
        currency: "USDT",
        metadata: {
          type: "course",
          user_id: context.user.id,
          course_id: course.id,
        },
      },
    });

    return NextResponse.json({ url: result.data.checkoutUrl });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout/binance/course] Error:", errMsg);
    return jsonError("Payment service unavailable", 503, { detail: errMsg });
  }
}
