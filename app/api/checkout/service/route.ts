import { Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { checkoutServiceSchema } from "@/lib/validators/api";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { convertUsdToCLP } from "@/lib/payments/currency";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";

function isFormRequest(request: Request) {
  const ct = request.headers.get("content-type") ?? "";
  return ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data");
}

export async function POST(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const context = await requireApiUser();

  if (!context) {
    if (isFormRequest(request)) {
      return NextResponse.redirect(`${baseUrl}/login`, 303);
    }
    return jsonError("Unauthorized", 401);
  }

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

  const service = await prisma.service.findFirst({
    where: { id: parsed.data.serviceId, is_active: true },
    select: { id: true, title: true },
  });

  if (!service) {
    return jsonError("Service not found", 404);
  }

  const order = await prisma.serviceOrder.create({
    data: {
      user_id: context.user.id,
      service_id: service.id,
      quoted_amount_cents: parsed.data.quotedAmountCents,
      currency: "USD",
      status: "pending_payment",
      customer_config: (parsed.data.config as object) ?? undefined,
      no_refund_accepted_at: new Date(),
    },
  });

  const client = getMercadoPagoClient();
  const preference = new Preference(client);
  const clpAmount = convertUsdToCLP(parsed.data.quotedAmountCents);

  const externalReference = JSON.stringify({
    type: "service",
    user_id: context.user.id,
    service_id: service.id,
    order_id: order.id,
  });

  // Only include notification_url if not localhost
  const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

  const result = await preference.create({
    body: {
      items: [
        {
          id: service.id,
          title: `Servicio: ${service.title}`,
          quantity: 1,
          unit_price: clpAmount,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: context.user.email ?? undefined,
      },
      back_urls: {
        success: `${baseUrl}/servicios?checkout=success&orderId=${order.id}`,
        failure: `${baseUrl}/servicios?checkout=failure&orderId=${order.id}`,
        pending: `${baseUrl}/servicios?checkout=pending&orderId=${order.id}`,
      },
      auto_return: "approved",
      ...(isLocalhost ? {} : { notification_url: `${baseUrl}/api/webhook/mercadopago` }),
      external_reference: externalReference,
      statement_descriptor: "PROLEVELCODE",
    },
  });

  if (!result.init_point) {
    return jsonError("Unable to create checkout preference", 500);
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(result.init_point, 303);
  }

  return NextResponse.json({ url: result.init_point, orderId: order.id });
}
