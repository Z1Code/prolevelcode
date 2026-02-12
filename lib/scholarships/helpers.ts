import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { EARLY_PRO_LIMIT } from "@/lib/tiers/config";

const POOL_DELAY_DAYS = 7;

/** Generate a human-readable scholarship code like BECA-A7K3M */
export function generateScholarshipCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BECA-${code}`;
}

/**
 * Auto-create an unassigned scholarship when a Pro tier is purchased.
 * Called from fulfill.ts and mercadopago webhook.
 */
export async function createScholarshipForProPurchase(
  userId: string,
  tierPurchaseId: string,
) {
  const now = new Date();
  const poolAvailableAt = new Date(now.getTime() + POOL_DELAY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.scholarship.create({
    data: {
      scholarship_code: generateScholarshipCode(),
      grantor_id: userId,
      tier_purchase_id: tierPurchaseId,
      status: "unassigned",
      invite_token: nanoid(32),
      pool_available_at: poolAvailableAt,
    },
  });
}

/**
 * Check if a scholarship is from an early Pro user (first N) → permanent.
 */
export async function isEarlyProScholarship(tierPurchaseId: string): Promise<boolean> {
  const firstPro = await prisma.tierPurchase.findMany({
    where: { tier: "pro", status: "active" },
    orderBy: { purchased_at: "asc" },
    take: EARLY_PRO_LIMIT,
    select: { id: true },
  });
  return firstPro.some((p) => p.id === tierPurchaseId);
}

/**
 * Process pool: find unassigned scholarships past their pool date and
 * auto-assign to oldest pending applications. Returns count assigned.
 */
export async function processScholarshipPool(): Promise<number> {
  const now = new Date();

  // Find scholarships that should be in the pool
  const poolScholarships = await prisma.scholarship.findMany({
    where: {
      status: "unassigned",
      pool_available_at: { lte: now },
    },
    orderBy: { granted_at: "asc" },
  });

  if (poolScholarships.length === 0) return 0;

  // Find pending applications (oldest first)
  const pendingApps = await prisma.scholarshipApplication.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "asc" },
    take: poolScholarships.length,
    include: { user: { select: { email: true } } },
  });

  let assigned = 0;

  for (let i = 0; i < Math.min(poolScholarships.length, pendingApps.length); i++) {
    const scholarship = poolScholarships[i];
    const app = pendingApps[i];

    const isPermanent = await isEarlyProScholarship(scholarship.tier_purchase_id);
    const expiresAt = isPermanent
      ? null
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.scholarship.update({
        where: { id: scholarship.id },
        data: {
          status: "active",
          recipient_email: app.user.email,
          recipient_user_id: app.user_id,
          application_id: app.id,
          applicant_reason: app.reason,
          assigned_at: now,
          redeemed_at: now,
          expires_at: expiresAt,
        },
      }),
      prisma.scholarshipApplication.update({
        where: { id: app.id },
        data: { status: "approved", reviewed_at: now },
      }),
    ]);

    // Notify Pro user about who received their scholarship
    try {
      const { getResendClient } = await import("@/lib/email/resend");
      const { env } = await import("@/lib/env");
      const grantor = await prisma.user.findUnique({
        where: { id: scholarship.grantor_id },
        select: { email: true },
      });
      if (grantor?.email) {
        const resend = getResendClient();
        await resend.emails.send({
          from: "ProLevelCode <no-reply@prolevelcode.dev>",
          to: grantor.email,
          subject: `Tu beca ${scholarship.scholarship_code} fue asignada`,
          html: `
            <h2>Tu beca fue asignada automaticamente</h2>
            <p>Codigo: <strong>${scholarship.scholarship_code}</strong></p>
            <p>Asignada a: <strong>${app.user.email}</strong></p>
            <p>Su mensaje:</p>
            <blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;">${app.reason}</blockquote>
            <p>${isPermanent ? "Esta beca es permanente por ser de los primeros 6 Pro." : "La beca dura 30 dias."}</p>
            <p><a href="${env.appUrl}/dashboard/beca">Ver mis becas</a></p>
          `,
        });
      }
    } catch {
      // silent — email failure shouldn't block assignment
    }

    assigned++;
  }

  return assigned;
}
