import { prisma } from "@/lib/prisma";

/**
 * Fulfill a crypto payment — creates enrollment or tier purchase.
 * Used by both auto-detection (check-payment) and manual admin approval.
 */
export async function fulfillCryptoPayment(payment: {
  id: string;
  user_id: string;
  type: string;
  target_id: string;
  amount_usdt: string;
  order_id: string;
}) {
  const amountCents = Math.round(parseFloat(payment.amount_usdt) * 100);

  if (payment.type === "course") {
    await prisma.enrollment.upsert({
      where: {
        user_id_course_id: {
          user_id: payment.user_id,
          course_id: payment.target_id,
        },
      },
      create: {
        user_id: payment.user_id,
        course_id: payment.target_id,
        payment_provider: "crypto",
        amount_paid_cents: amountCents,
        currency: "USDT",
        status: "active",
      },
      update: {
        status: "active",
        payment_provider: "crypto",
        amount_paid_cents: amountCents,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        payment_provider: "crypto",
        amount_cents: amountCents,
        currency: "USDT",
        status: "approved",
        metadata: {
          type: "course",
          user_id: payment.user_id,
          course_id: payment.target_id,
          crypto_order_id: payment.order_id,
        },
      },
    });
  } else if (payment.type === "tier") {
    const tierPurchase = await prisma.tierPurchase.create({
      data: {
        user_id: payment.user_id,
        tier: payment.target_id,
        status: "active",
        payment_provider: "crypto",
        payment_reference: payment.order_id,
        amount_paid_cents: amountCents,
        currency: "USDT",
      },
    });

    // Auto-create scholarship slot for Pro purchases
    if (payment.target_id === "pro") {
      const { createScholarshipForProPurchase } = await import("@/lib/scholarships/helpers");
      await createScholarshipForProPurchase(payment.user_id, tierPurchase.id);
    }

    await prisma.paymentTransaction.create({
      data: {
        payment_provider: "crypto",
        amount_cents: amountCents,
        currency: "USDT",
        status: "approved",
        metadata: {
          type: "tier",
          user_id: payment.user_id,
          tier: payment.target_id,
          crypto_order_id: payment.order_id,
        },
      },
    });
  }
}
