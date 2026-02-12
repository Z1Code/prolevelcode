import { Payment } from "mercadopago";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { getResendClient } from "@/lib/email/resend";
import { courseAccessTemplate, coursePurchaseTemplate } from "@/lib/email/templates";

function verifySignature(request: Request): boolean {
  const secret = env.mercadoPagoWebhookSecret;
  if (!secret) {
    console.error("[mp/webhook] Missing MERCADOPAGO_WEBHOOK_SECRET");
    return false;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key && value) parts[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Get data_id from query string
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? "";

  // Build manifest: id:[data_id];request-id:[x-request-id];ts:[ts];
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  if (hmac.length !== v1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hmac, "utf8"), Buffer.from(v1, "utf8"));
}

export async function POST(request: Request) {
  const body = await request.text();
  let payload: { action?: string; type?: string; data?: { id?: string } };

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify HMAC signature
  if (!verifySignature(request)) {
    console.warn("[mp/webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // We only care about payment notifications
  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = payload.data.id;

  // Deduplicate via PaymentEvent table
  try {
    await prisma.paymentEvent.create({
      data: {
        event_id: `mp_payment_${paymentId}`,
        type: payload.action ?? "payment.unknown",
        payload: JSON.parse(body),
      },
    });
  } catch {
    console.log(`[mp/webhook] Duplicate event for payment ${paymentId}, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Fetch full payment from MercadoPago
  const client = getMercadoPagoClient();
  const paymentApi = new Payment(client);
  const payment = await paymentApi.get({ id: Number(paymentId) });

  if (!payment.external_reference) {
    return NextResponse.json({ received: true });
  }

  let ref: { type?: string; user_id?: string; course_id?: string; service_id?: string; order_id?: string; tier?: string };
  try {
    ref = JSON.parse(payment.external_reference);
  } catch {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = String(payment.id);
  const amountPaidCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const currency = (payment.currency_id ?? "CLP").toUpperCase();

  console.log(`[mp/webhook] Payment ${mpPaymentId} status=${payment.status} type=${ref.type}`);

  if (payment.status === "approved") {
    if (ref.type === "course" && ref.user_id && ref.course_id) {
      await prisma.enrollment.upsert({
        where: { user_id_course_id: { user_id: ref.user_id, course_id: ref.course_id } },
        update: {
          mp_preference_id: payment.order?.id ? String(payment.order.id) : null,
          mp_payment_id: mpPaymentId,
          amount_paid_cents: amountPaidCents,
          currency,
          status: "active",
        },
        create: {
          user_id: ref.user_id,
          course_id: ref.course_id,
          mp_preference_id: payment.order?.id ? String(payment.order.id) : null,
          mp_payment_id: mpPaymentId,
          amount_paid_cents: amountPaidCents,
          currency,
          status: "active",
        },
      });

      // Record transaction
      await prisma.paymentTransaction.create({
        data: {
          mp_payment_id: mpPaymentId,
          amount_cents: amountPaidCents,
          currency,
          status: "approved",
          metadata: { type: "course", course_id: ref.course_id, user_id: ref.user_id },
        },
      });

      // Send confirmation emails
      const [userRecord, courseRecord] = await Promise.all([
        prisma.user.findUnique({ where: { id: ref.user_id }, select: { email: true } }),
        prisma.course.findUnique({ where: { id: ref.course_id }, select: { title: true } }),
      ]);

      const userEmail = userRecord?.email ?? null;
      const courseTitle = courseRecord?.title ?? "Tu curso";

      if (userEmail) {
        const resend = getResendClient();
        const purchaseEmail = coursePurchaseTemplate({
          courseTitle,
          dashboardUrl: `${env.appUrl}/dashboard/cursos`,
        });
        const accessEmail = courseAccessTemplate({
          courseTitle,
          dashboardUrl: `${env.appUrl}/dashboard/cursos`,
        });

        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userEmail,
          subject: purchaseEmail.subject,
          html: purchaseEmail.html,
        });

        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: userEmail,
          subject: accessEmail.subject,
          html: accessEmail.html,
        });
      }
    }

    if (ref.type === "tier" && ref.user_id && ref.tier) {
      const tierPurchase = await prisma.tierPurchase.create({
        data: {
          user_id: ref.user_id,
          tier: ref.tier,
          status: "active",
          payment_provider: "mercadopago",
          payment_reference: mpPaymentId,
          amount_paid_cents: amountPaidCents,
          currency,
          // lifetime: no expires_at
        },
      });

      // Auto-create scholarship slot for Pro purchases
      if (ref.tier === "pro") {
        const { createScholarshipForProPurchase } = await import("@/lib/scholarships/helpers");
        await createScholarshipForProPurchase(ref.user_id, tierPurchase.id);
      }

      await prisma.paymentTransaction.create({
        data: {
          mp_payment_id: mpPaymentId,
          payment_provider: "mercadopago",
          amount_cents: amountPaidCents,
          currency,
          status: "approved",
          metadata: { type: "tier", tier: ref.tier, user_id: ref.user_id },
        },
      });

      // Send confirmation email
      const tierUser = await prisma.user.findUnique({
        where: { id: ref.user_id },
        select: { email: true },
      });

      if (tierUser?.email) {
        try {
          const resend = getResendClient();
          await resend.emails.send({
            from: "ProLevelCode <no-reply@prolevelcode.dev>",
            to: tierUser.email,
            subject: `Plan ${ref.tier === "pro" ? "Pro" : "Basic"} activado`,
            html: `<h2>Tu plan ${ref.tier === "pro" ? "Pro" : "Basic"} esta activo</h2><p>Ya tienes acceso a ${ref.tier === "pro" ? "todos los cursos" : "los cursos Basic"}.</p><p><a href="${env.appUrl}/dashboard/plan">Ver mi plan</a></p>`,
          });
        } catch {
          // silent
        }
      }
    }

    if (ref.type === "service" && ref.order_id) {
      await prisma.serviceOrder.update({
        where: { id: ref.order_id },
        data: {
          status: "pending_kickoff",
          mp_preference_id: payment.order?.id ? String(payment.order.id) : null,
          mp_payment_id: mpPaymentId,
          paid_amount_cents: amountPaidCents,
          paid_at: new Date(),
        },
      });

      await prisma.paymentTransaction.create({
        data: {
          mp_payment_id: mpPaymentId,
          amount_cents: amountPaidCents,
          currency,
          status: "approved",
          metadata: { type: "service", order_id: ref.order_id },
        },
      });
    }
  }

  if (payment.status === "refunded") {
    if (mpPaymentId) {
      await prisma.enrollment.updateMany({
        where: { mp_payment_id: mpPaymentId },
        data: { status: "refunded" },
      });
      await prisma.serviceOrder.updateMany({
        where: { mp_payment_id: mpPaymentId },
        data: { status: "refunded" },
      });
    }
  }

  console.log(`[mp/webhook] Processed payment ${mpPaymentId} successfully`);
  return NextResponse.json({ received: true });
}
