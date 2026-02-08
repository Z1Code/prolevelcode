import Stripe from "stripe";
import { NextResponse } from "next/server";
import { checkoutServiceSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/client";
import { getBaseUrl } from "@/lib/stripe/helpers";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return jsonError("Unauthorized", 401);

  const raw = await parseRequestBody<{
    serviceId?: string;
    quotedAmountCents?: string | number;
    acceptance?: { noRefund?: boolean };
    noRefund?: string;
    config?: Record<string, unknown>;
  }>(request);

  const parsed = checkoutServiceSchema.safeParse({
    serviceId: raw.serviceId,
    quotedAmountCents: typeof raw.quotedAmountCents === "string" ? Number(raw.quotedAmountCents) : raw.quotedAmountCents,
    acceptance: raw.acceptance ?? { noRefund: raw.noRefund === "true" || raw.noRefund === "on" },
    config: raw.config,
  });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  const supabase = createAdminSupabaseClient();
  const { data: service } = await supabase
    .from("services")
    .select("id,title,is_active")
    .eq("id", parsed.data.serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    return jsonError("Service not found", 404);
  }

  const { data: order, error: orderError } = await supabase
    .from("service_orders")
    .insert({
      user_id: context.user.id,
      service_id: service.id,
      quoted_amount_cents: parsed.data.quotedAmountCents,
      currency: "USD",
      status: "pending_payment",
      customer_config: parsed.data.config,
      no_refund_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return jsonError("Unable to create service order", 500, orderError?.message);
  }

  const stripe = getStripeServerClient();
  const baseUrl = getBaseUrl();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: context.user.email ?? undefined,
    success_url: `${baseUrl}/servicios?checkout=success&orderId=${String(order.id)}`,
    cancel_url: `${baseUrl}/servicios?checkout=cancelled&orderId=${String(order.id)}`,
    metadata: {
      type: "service",
      user_id: context.user.id,
      service_id: String(service.id),
      order_id: String(order.id),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: `Servicio: ${String(service.title)}`,
            description: "Pedido personalizado con no-reembolso aceptado.",
          },
          unit_amount: parsed.data.quotedAmountCents,
        },
      },
    ],
  };

  const session = await stripe.checkout.sessions.create(params);

  if (!session.url) {
    return jsonError("Unable to create checkout session", 500);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    return NextResponse.redirect(session.url, 303);
  }

  return NextResponse.json({ url: session.url, orderId: String(order.id) });
}
