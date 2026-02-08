import Stripe from "stripe";
import { NextResponse } from "next/server";
import { checkoutCourseSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/client";
import { getBaseUrl } from "@/lib/stripe/helpers";
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

  const supabase = createAdminSupabaseClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,slug,title,price_cents,currency,stripe_price_id,is_published")
    .eq("id", parsed.data.courseId)
    .eq("is_published", true)
    .maybeSingle();

  if (!course) {
    return jsonError("Course not found", 404);
  }

  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("user_id", context.user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingEnrollment) {
    return jsonError("Course already purchased", 409);
  }

  const stripe = getStripeServerClient();
  const baseUrl = getBaseUrl();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: context.user.email ?? undefined,
    success_url: `${baseUrl}/dashboard/cursos/${String(course.slug)}?checkout=success`,
    cancel_url: `${baseUrl}/cursos/${String(course.slug)}?checkout=cancelled`,
    metadata: {
      type: "course",
      user_id: context.user.id,
      course_id: String(course.id),
    },
    line_items: course.stripe_price_id
      ? [{ price: String(course.stripe_price_id), quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: String(course.currency ?? "USD").toLowerCase(),
              product_data: { name: String(course.title) },
              unit_amount: Number(course.price_cents ?? 0),
            },
          },
        ],
    allow_promotion_codes: true,
  };

  const session = await stripe.checkout.sessions.create(params);

  if (!session.url) {
    return jsonError("Unable to create checkout session", 500);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return NextResponse.redirect(session.url, 303);
  }

  return NextResponse.json({ url: session.url });
}
