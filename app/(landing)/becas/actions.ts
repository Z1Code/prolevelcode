"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { processScholarshipPool } from "@/lib/scholarships/helpers";

export async function applyForScholarship(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/becas");

  const reason = (fd.get("reason") as string)?.trim();
  if (!reason || reason.length < 20) {
    redirect("/becas?error=razon-corta");
  }
  if (reason.length > 500) {
    redirect("/becas?error=razon-larga");
  }

  // Check if user already has an active tier or pending application
  const existingTier = await prisma.tierPurchase.findFirst({
    where: { user_id: user.id, status: "active" },
  });
  if (existingTier) {
    redirect("/becas?error=ya-tiene-plan");
  }

  const existingApp = await prisma.scholarshipApplication.findFirst({
    where: { user_id: user.id, status: "pending" },
  });
  if (existingApp) {
    redirect("/becas?error=ya-aplicaste");
  }

  // Check existing active scholarship
  const existingScholarship = await prisma.scholarship.findFirst({
    where: { recipient_user_id: user.id, status: "active" },
  });
  if (existingScholarship) {
    redirect("/becas?error=ya-tiene-beca");
  }

  await prisma.scholarshipApplication.create({
    data: {
      user_id: user.id,
      reason,
    },
  });

  // Try to process pool (auto-assign available scholarships)
  await processScholarshipPool();

  revalidatePath("/becas");
  redirect("/becas?success=aplicacion-enviada");
}
