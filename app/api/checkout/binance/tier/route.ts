import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { createBinanceOrder } from "@/lib/binance/client";
import { checkoutTierSchema } from "@/lib/validators/tier";
import { getTierConfig, getTierPriceUsdt } from "@/lib/tiers/config";
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

  const allowed = await assertRateLimit("checkout/binance/tier", context.user.id, 10, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const raw = await parseRequestBody<{ tier?: string }>(request);
  const parsed = checkoutTierSchema.safeParse({ tier: raw.tier });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  const tierConfig = getTierConfig(parsed.data.tier);
  const amountUsdt = getTierPriceUsdt(parsed.data.tier);
  const merchantTradeNo = `PLC_T_${nanoid(16)}`;

  try {
    const result = await createBinanceOrder({
      merchantTradeNo,
      totalAmount: amountUsdt,
      currency: "USDT",
      description: `Plan ${tierConfig.name} - ProLevelCode`,
      returnUrl: `${baseUrl}/dashboard/plan?checkout=success`,
      cancelUrl: `${baseUrl}/planes?checkout=failure`,
      webhookUrl: `${baseUrl}/api/webhook/binance`,
      metadata: {
        type: "tier",
        user_id: context.user.id,
        tier: parsed.data.tier,
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
          type: "tier",
          user_id: context.user.id,
          tier: parsed.data.tier,
        },
      },
    });

    return NextResponse.json({ url: result.data.checkoutUrl });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout/binance/tier] Error:", errMsg);
    return jsonError("Payment service unavailable", 503, { detail: errMsg });
  }
}
