"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getResendClient } from "@/lib/email/resend";
import { env } from "@/lib/env";
import { isEarlyProScholarship } from "@/lib/scholarships/helpers";

/** Pro user manually assigns their scholarship to a specific email */
export async function assignScholarship(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const scholarshipId = (fd.get("scholarshipId") as string)?.trim();
  const recipientEmail = (fd.get("recipientEmail") as string)?.trim().toLowerCase();

  if (!scholarshipId || !recipientEmail) {
    redirect("/dashboard/beca?error=datos-requeridos");
  }

  // Don't allow self-scholarship
  if (recipientEmail === user.email) {
    redirect("/dashboard/beca?error=no-auto-beca");
  }

  const scholarship = await prisma.scholarship.findFirst({
    where: { id: scholarshipId, grantor_id: user.id, status: "unassigned" },
  });

  if (!scholarship) {
    redirect("/dashboard/beca?error=beca-no-disponible");
  }

  await prisma.scholarship.update({
    where: { id: scholarship.id },
    data: {
      status: "pending",
      recipient_email: recipientEmail,
      assigned_at: new Date(),
    },
  });

  // Send email with redemption link
  const isPermanent = await isEarlyProScholarship(scholarship.tier_purchase_id);
  const durationText = isPermanent
    ? "acceso permanente (de por vida)"
    : "30 dias de acceso";

  try {
    const resend = getResendClient();
    const redeemUrl = `${env.appUrl}/beca/redeem?token=${scholarship.invite_token}`;
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.dev>",
      to: recipientEmail,
      subject: "Te han otorgado una beca en ProLevelCode",
      html: `
        <h2>Beca de ProLevelCode</h2>
        <p>Alguien te ha otorgado ${durationText} a los cursos Basic de ProLevelCode.</p>
        <p>Codigo de beca: <strong>${scholarship.scholarship_code}</strong></p>
        <p><a href="${redeemUrl}" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Activar beca</a></p>
        <p>Este enlace es unico y no expira hasta ser usado.</p>
      `,
    });
  } catch {
    // email failure shouldn't block
  }

  revalidatePath("/dashboard/beca");
  redirect("/dashboard/beca?success=asignada");
}

export async function revokeScholarship(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const scholarshipId = (fd.get("scholarshipId") as string)?.trim();
  if (!scholarshipId) return;

  await prisma.scholarship.updateMany({
    where: { id: scholarshipId, grantor_id: user.id, status: { in: ["pending", "unassigned"] } },
    data: { status: "revoked" },
  });

  revalidatePath("/dashboard/beca");
}
