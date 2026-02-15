import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/tiers/config";
import { env } from "@/lib/env";
import { getResendClient } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await req.formData();
  const tier = formData.get("tier") as string;
  const screenshot = formData.get("screenshot") as File | null;

  // Validate tier
  if (tier !== "basic" && tier !== "pro") {
    return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
  }

  // Validate screenshot
  if (!screenshot || screenshot.size === 0) {
    return NextResponse.json({ error: "Captura requerida" }, { status: 400 });
  }
  if (screenshot.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });
  }
  if (!screenshot.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
  }

  // Check user doesn't already have an active tier purchase
  const existingPurchase = await prisma.tierPurchase.findFirst({
    where: { user_id: user.id, status: "active" },
  });
  if (existingPurchase) {
    return NextResponse.json({ error: "Ya tienes un plan activo" }, { status: 400 });
  }

  // Check no pending PayPal payment already
  const existingPending = await prisma.paypalPayment.findFirst({
    where: { user_id: user.id, status: "pending" },
  });
  if (existingPending) {
    return NextResponse.json({ error: "Ya tienes un pago PayPal pendiente de verificacion" }, { status: 400 });
  }

  // Convert screenshot to base64 data URL
  const buffer = Buffer.from(await screenshot.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${screenshot.type};base64,${base64}`;

  const tierConfig = TIERS[tier];
  const amountCents = tierConfig.priceCents;

  // Store payment record
  const payment = await prisma.paypalPayment.create({
    data: {
      user_id: user.id,
      tier,
      amount_usd_cents: amountCents,
      screenshot_b64: dataUrl,
    },
  });

  // Fetch user details for email
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { full_name: true, email: true },
  });

  // Send admin notification email
  try {
    const resend = getResendClient();
    const amountDisplay = `$${(amountCents / 100).toFixed(0)} USD`;

    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.dev>",
      to: env.adminEmails,
      subject: `Nuevo pago PayPal pendiente - ${tierConfig.name} (${amountDisplay})`,
      html: `
        <h2>Nuevo pago PayPal pendiente</h2>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Email:</td><td><strong>${dbUser?.email ?? user.email}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Nombre:</td><td>${dbUser?.full_name ?? "-"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Plan:</td><td><strong>${tierConfig.name}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Monto:</td><td><strong>${amountDisplay}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Fecha:</td><td>${new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" })}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">ID:</td><td style="font-family:monospace;font-size:12px;">${payment.id}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Captura del comprobante:</h3>
        <img src="${dataUrl}" alt="Comprobante PayPal" style="max-width:600px;border-radius:8px;border:1px solid #333;" />
        <p style="margin-top:16px;"><a href="${env.appUrl}/admin/pagos">Ir al panel de pagos</a></p>
      `,
    });
  } catch {
    // Email failure shouldn't block the payment submission
  }

  return NextResponse.json({ ok: true, paymentId: payment.id });
}
