import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBinanceWebhook } from "@/lib/binance/client";
import { getResendClient } from "@/lib/email/resend";
import { coursePurchaseTemplate } from "@/lib/email/templates";
import { env } from "@/lib/env";

interface BinanceWebhookPayload {
  bizType: string;
  bizId: string;
  bizIdStr: string;
  data: string; // JSON string
}

interface BinanceOrderData {
  merchantTradeNo: string;
  totalFee: string;
  currency: string;
  transactTime: number;
  productType: string;
  tradeType: string;
  payerInfo?: {
    payerEmail?: string;
  };
}

export async function POST(request: Request) {
  const body = await request.text();

  // Verify signature
  const timestamp = request.headers.get("binancepay-timestamp") ?? "";
  const nonce = request.headers.get("binancepay-nonce") ?? "";
  const signature = request.headers.get("binancepay-signature") ?? "";

  if (!timestamp || !nonce || !signature) {
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Missing headers" }, { status: 401 });
  }

  if (!verifyBinanceWebhook(timestamp, nonce, body, signature)) {
    console.warn("[binance/webhook] Signature verification failed");
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid signature" }, { status: 401 });
  }

  let payload: BinanceWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid JSON" }, { status: 400 });
  }

  // Deduplicate
  const eventId = `binance_${payload.bizIdStr || payload.bizId}`;
  try {
    await prisma.paymentEvent.create({
      data: {
        event_id: eventId,
        type: payload.bizType,
        payload: JSON.parse(body),
      },
    });
  } catch {
    console.log(`[binance/webhook] Duplicate event ${eventId}, skipping`);
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "OK" });
  }

  // Only process PAY_SUCCESS
  if (payload.bizType !== "PAY") {
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "OK" });
  }

  let orderData: BinanceOrderData;
  try {
    orderData = JSON.parse(payload.data);
  } catch {
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid data" }, { status: 400 });
  }

  const merchantTradeNo = orderData.merchantTradeNo;
  console.log(`[binance/webhook] Processing order ${merchantTradeNo}`);

  // Look up our BinancePayment record
  const binancePayment = await prisma.binancePayment.findUnique({
    where: { merchant_trade_no: merchantTradeNo },
  });

  if (!binancePayment) {
    console.error(`[binance/webhook] Payment not found: ${merchantTradeNo}`);
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "OK" });
  }

  // Update payment status
  await prisma.binancePayment.update({
    where: { id: binancePayment.id },
    data: { status: "PAID", binance_order_id: payload.bizIdStr || binancePayment.binance_order_id },
  });

  const meta = binancePayment.metadata as { type?: string; user_id?: string; course_id?: string; tier?: string } | null;
  if (!meta || !meta.user_id) {
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "OK" });
  }

  const amountCents = Math.round(parseFloat(orderData.totalFee) * 100);

  if (meta.type === "course" && meta.course_id) {
    // Create enrollment
    await prisma.enrollment.upsert({
      where: { user_id_course_id: { user_id: meta.user_id, course_id: meta.course_id } },
      update: {
        payment_provider: "binance",
        binance_order_id: merchantTradeNo,
        amount_paid_cents: amountCents,
        currency: "USDT",
        status: "active",
      },
      create: {
        user_id: meta.user_id,
        course_id: meta.course_id,
        payment_provider: "binance",
        binance_order_id: merchantTradeNo,
        amount_paid_cents: amountCents,
        currency: "USDT",
        status: "active",
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        binance_order_id: merchantTradeNo,
        payment_provider: "binance",
        amount_cents: amountCents,
        currency: "USDT",
        status: "approved",
        metadata: { type: "course", course_id: meta.course_id, user_id: meta.user_id },
      },
    });

    // Send confirmation email
    const [userRecord, courseRecord] = await Promise.all([
      prisma.user.findUnique({ where: { id: meta.user_id }, select: { email: true } }),
      prisma.course.findUnique({ where: { id: meta.course_id }, select: { title: true } }),
    ]);

    if (userRecord?.email) {
      try {
        const resend = getResendClient();
        const emailData = coursePurchaseTemplate({
          courseTitle: courseRecord?.title ?? "Tu curso",
          dashboardUrl: `${env.appUrl}/dashboard/cursos`,
        });
        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userRecord.email,
          subject: emailData.subject,
          html: emailData.html,
        });
      } catch {
        // email failure shouldn't block webhook
      }
    }
  }

  if (meta.type === "tier" && meta.tier) {
    // Create tier purchase
    await prisma.tierPurchase.create({
      data: {
        user_id: meta.user_id,
        tier: meta.tier,
        status: "active",
        payment_provider: "binance",
        payment_reference: merchantTradeNo,
        amount_paid_cents: amountCents,
        currency: "USDT",
        // lifetime: no expires_at
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        binance_order_id: merchantTradeNo,
        payment_provider: "binance",
        amount_cents: amountCents,
        currency: "USDT",
        status: "approved",
        metadata: { type: "tier", tier: meta.tier, user_id: meta.user_id },
      },
    });

    // Send confirmation email
    const userRecord = await prisma.user.findUnique({
      where: { id: meta.user_id },
      select: { email: true },
    });

    if (userRecord?.email) {
      try {
        const resend = getResendClient();
        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userRecord.email,
          subject: `Plan ${meta.tier === "pro" ? "Pro" : "Basic"} activado`,
          html: `<h2>Tu plan ${meta.tier === "pro" ? "Pro" : "Basic"} esta activo</h2><p>Ya tienes acceso a ${meta.tier === "pro" ? "todos los cursos" : "los cursos Basic"}.</p><p><a href="${env.appUrl}/dashboard/plan">Ver mi plan</a></p>`,
        });
      } catch {
        // silent
      }
    }
  }

  console.log(`[binance/webhook] Processed order ${merchantTradeNo} successfully`);
  return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "OK" });
}
