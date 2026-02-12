import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { BINANCE_ID } from "@/lib/crypto/config";
import { jsonError } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const context = await requireApiUser();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const orderId = request.nextUrl.searchParams.get("order");
  if (!orderId) {
    return jsonError("Missing order ID", 400);
  }

  const payment = await prisma.cryptoPayment.findUnique({
    where: { order_id: orderId },
  });

  if (!payment || payment.user_id !== context.user.id) {
    return jsonError("Order not found", 404);
  }

  return NextResponse.json({
    orderId: payment.order_id,
    amountUsdt: payment.amount_usdt,
    walletAddress: env.cryptoWalletAddress ?? "",
    solanaAddress: env.cryptoSolanaAddress ?? "",
    binanceId: BINANCE_ID,
    expiresAt: payment.expires_at.toISOString(),
    status: payment.status,
  });
}
