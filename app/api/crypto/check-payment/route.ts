import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { findMatchingTransfer } from "@/lib/crypto/blockchain";
import { fulfillCryptoPayment } from "@/lib/crypto/fulfill";
import { jsonError } from "@/lib/utils/http";
import { assertRateLimit } from "@/lib/utils/rate-limit";

export async function GET(request: NextRequest) {
  const context = await requireApiUser();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const orderId = request.nextUrl.searchParams.get("order");
  if (!orderId) {
    return jsonError("Missing order ID", 400);
  }

  const allowed = await assertRateLimit("crypto/check", context.user.id, 30, 60);
  if (!allowed) {
    return jsonError("Too many requests", 429);
  }

  const payment = await prisma.cryptoPayment.findUnique({
    where: { order_id: orderId },
  });

  if (!payment || payment.user_id !== context.user.id) {
    return jsonError("Order not found", 404);
  }

  // Already completed
  if (payment.status === "completed") {
    return NextResponse.json({
      status: "completed",
      txHash: payment.tx_hash,
      redirectUrl: getRedirectUrl(payment.type, payment.target_id),
    });
  }

  // Expired
  if (payment.status === "expired" || new Date() > payment.expires_at) {
    if (payment.status !== "expired") {
      await prisma.cryptoPayment.update({
        where: { id: payment.id },
        data: { status: "expired" },
      });
    }
    return NextResponse.json({ status: "expired" });
  }

  // Check blockchain for matching transfer
  try {
    const sinceTimestamp = Math.floor(payment.created_at.getTime() / 1000);
    const match = await findMatchingTransfer(payment.amount_usdt, sinceTimestamp);

    if (!match) {
      return NextResponse.json({ status: "pending" });
    }

    // Prevent false positives: check if this tx_hash was already used by another order
    const alreadyUsed = await prisma.cryptoPayment.findFirst({
      where: {
        tx_hash: match.txHash,
        id: { not: payment.id },
      },
    });

    if (alreadyUsed) {
      console.warn(
        `[crypto/check-payment] tx_hash ${match.txHash} already used by order ${alreadyUsed.order_id}, skipping for ${payment.order_id}`,
      );
      return NextResponse.json({ status: "pending" });
    }

    // Payment found — fulfill the order
    await prisma.cryptoPayment.update({
      where: { id: payment.id, status: "pending" },
      data: {
        status: "completed",
        tx_hash: match.txHash,
        completed_at: new Date(),
      },
    });

    await fulfillCryptoPayment(payment);

    return NextResponse.json({
      status: "completed",
      txHash: match.txHash,
      redirectUrl: getRedirectUrl(payment.type, payment.target_id),
    });
  } catch (err) {
    console.error("[crypto/check-payment] Error:", err);
    return NextResponse.json({ status: "pending" });
  }
}

function getRedirectUrl(type: string, targetId: string): string {
  if (type === "tier") {
    return "/dashboard/plan?checkout=success";
  }
  return "/dashboard/cursos?checkout=success";
}
