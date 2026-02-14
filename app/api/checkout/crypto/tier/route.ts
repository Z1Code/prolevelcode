import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { checkoutTierSchema } from "@/lib/validators/tier";
import { getTierConfig } from "@/lib/tiers/config";
import { parseRequestBody } from "@/lib/utils/request-body";
import { jsonError } from "@/lib/utils/http";
import { assertRateLimit } from "@/lib/utils/rate-limit";
import { generateUniqueAmount, CRYPTO_PAYMENT_EXPIRY_MINUTES } from "@/lib/crypto/config";

export async function POST(request: NextRequest) {
  const context = await requireApiUser();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const allowed = await assertRateLimit("checkout/crypto/tier", context.user.id, 10, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const raw = await parseRequestBody<{ tier?: string }>(request);
  const parsed = checkoutTierSchema.safeParse({ tier: raw.tier });

  if (!parsed.success) {
    return jsonError("Invalid payload", 400, parsed.error.flatten());
  }

  const tierConfig = getTierConfig(parsed.data.tier);
  const orderId = `PLC_CT_${nanoid(16)}`;
  const amountUsdt = generateUniqueAmount(tierConfig.priceCents);
  const expiresAt = new Date(Date.now() + CRYPTO_PAYMENT_EXPIRY_MINUTES * 60 * 1000);

  await prisma.cryptoPayment.create({
    data: {
      order_id: orderId,
      user_id: context.user.id,
      type: "tier",
      target_id: parsed.data.tier,
      amount_usdt: amountUsdt,
      status: "pending",
      expires_at: expiresAt,
    },
  });

  // Notify admin about new payment attempt
  try {
    const { getResendClient } = await import("@/lib/email/resend");
    const { env: appEnv } = await import("@/lib/env");
    const adminEmails = appEnv.adminEmails;
    if (adminEmails.length > 0) {
      const resend = getResendClient();
      await resend.emails.send({
        from: "ProLevelCode <no-reply@prolevelcode.com>",
        to: adminEmails,
        subject: `Nuevo intento de pago crypto - ${tierConfig.name} (${amountUsdt} USDT)`,
        html: `
          <h2>Nuevo intento de pago crypto</h2>
          <p><strong>Usuario:</strong> ${context.user.email}</p>
          <p><strong>Plan:</strong> ${parsed.data.tier.toUpperCase()}</p>
          <p><strong>Monto:</strong> ${amountUsdt} USDT</p>
          <p><strong>Orden:</strong> ${orderId}</p>
          <p><strong>Expira:</strong> ${expiresAt.toLocaleString("es-CL")}</p>
          <p><a href="${appEnv.appUrl}/admin/pagos" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Ver en admin</a></p>
        `,
      });
    }
  } catch {
    // email failure shouldn't block checkout
  }

  const baseUrl = request.nextUrl.origin;
  return NextResponse.json({
    url: `${baseUrl}/crypto/pay?order=${orderId}`,
  });
}
