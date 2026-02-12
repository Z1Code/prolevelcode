"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getResendClient } from "@/lib/email/resend";
import { env } from "@/lib/env";
import { EARLY_PRO_LIMIT } from "@/lib/tiers/config";

export async function grantScholarship(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const recipientEmail = (fd.get("recipientEmail") as string)?.trim().toLowerCase();
  if (!recipientEmail) {
    redirect("/dashboard/beca?error=email-requerido");
  }

  // Verify user has active Pro tier
  const proTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: user.id,
      tier: "pro",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
  });

  if (!proTier) {
    redirect("/dashboard/beca?error=no-pro");
  }

  // Check if this tier purchase already has a scholarship
  const existingScholarship = await prisma.scholarship.findUnique({
    where: { tier_purchase_id: proTier.id },
  });

  if (existingScholarship) {
    redirect("/dashboard/beca?error=ya-otorgada");
  }

  // Don't allow self-scholarship
  if (recipientEmail === user.email) {
    redirect("/dashboard/beca?error=no-auto-beca");
  }

  // Check if this Pro purchase is among the first N → permanent scholarship
  const firstProPurchases = await prisma.tierPurchase.findMany({
    where: { tier: "pro", status: "active" },
    orderBy: { purchased_at: "asc" },
    take: EARLY_PRO_LIMIT,
    select: { id: true },
  });

  const isEarlyPro = firstProPurchases.some((p) => p.id === proTier.id);

  const inviteToken = nanoid(32);

  await prisma.scholarship.create({
    data: {
      grantor_id: user.id,
      tier_purchase_id: proTier.id,
      recipient_email: recipientEmail,
      status: "pending",
      invite_token: inviteToken,
      // Early Pro users grant permanent scholarships (no expiry set on grant,
      // redemption page also skips setting expires_at)
    },
  });

  // Send email
  const isPermanent = isEarlyPro;
  const durationText = isPermanent
    ? "acceso permanente (de por vida)"
    : "30 dias de acceso";

  try {
    const resend = getResendClient();
    const redeemUrl = `${env.appUrl}/beca/redeem?token=${inviteToken}`;
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.dev>",
      to: recipientEmail,
      subject: "Te han otorgado una beca en ProLevelCode",
      html: `
        <h2>Beca de ProLevelCode</h2>
        <p>Alguien te ha otorgado ${durationText} a los cursos Basic de ProLevelCode.</p>
        <p><a href="${redeemUrl}" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Activar beca</a></p>
        <p>Este enlace es unico y no expira hasta ser usado.</p>
      `,
    });
  } catch {
    // email failure shouldn't block the grant
  }

  revalidatePath("/dashboard/beca");
  redirect("/dashboard/beca?success=otorgada");
}

export async function revokeScholarship(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const scholarshipId = (fd.get("scholarshipId") as string)?.trim();
  if (!scholarshipId) return;

  await prisma.scholarship.updateMany({
    where: { id: scholarshipId, grantor_id: user.id },
    data: { status: "revoked" },
  });

  revalidatePath("/dashboard/beca");
}
