import { Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { convertUsdToCLP } from "@/lib/payments/currency";
import { checkoutTierSchema } from "@/lib/validators/tier";
import { getTierConfig } from "@/lib/tiers/config";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";
import { assertRateLimit } from "@/lib/utils/rate-limit";

function isFormRequest(request: Request) {
  const ct = request.headers.get("content-type") ?? "";
  return ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data");
}

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
    if (isFormRequest(request)) {
      return NextResponse.redirect(`${baseUrl}/login`, 303);
    }
    return jsonError("Unauthorized", 401);
  }

  const allowed = await assertRateLimit("checkout/tier", context.user.id, 10, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const raw = await parseRequestBody<{ tier?: string }>(request);
  const parsed = checkoutTierSchema.safeParse({ tier: raw.tier });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  // Check if user already has this tier or higher
  const existingTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: context.user.id,
      status: "active",
      tier: parsed.data.tier === "basic" ? { in: ["basic", "pro"] } : "pro",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
  });

  if (existingTier) {
    if (isFormRequest(request)) {
      return NextResponse.redirect(`${baseUrl}/dashboard/plan?already=true`, 303);
    }
    return jsonError("You already have this tier or higher", 409);
  }

  const tierConfig = getTierConfig(parsed.data.tier);
  const localAmount = convertUsdToCLP(tierConfig.priceCents);

  const externalReference = JSON.stringify({
    type: "tier",
    user_id: context.user.id,
    tier: parsed.data.tier,
  });

  const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

  let initPoint: string;

  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `tier_${parsed.data.tier}`,
            title: `Plan ${tierConfig.name} - ProLevelCode`,
            quantity: 1,
            unit_price: localAmount,
            currency_id: "CLP",
          },
        ],
        payer: {
          email: context.user.email ?? undefined,
        },
        back_urls: {
          success: `${baseUrl}/dashboard/plan?checkout=success`,
          failure: `${baseUrl}/planes?checkout=failure`,
          pending: `${baseUrl}/planes?checkout=pending`,
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
    console.error("[checkout/tier] MercadoPago error:", errMsg);
    if (isFormRequest(request)) {
      return NextResponse.redirect(`${baseUrl}/planes?checkout=error`, 303);
    }
    return jsonError("Payment service unavailable", 503, { detail: errMsg });
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(initPoint, 303);
  }

  return NextResponse.json({ url: initPoint });
}
