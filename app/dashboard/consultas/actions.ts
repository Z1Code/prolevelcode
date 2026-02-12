"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";

export async function submitProQuery(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tier = await getUserTier(user.id);
  if (tier !== "pro") {
    redirect("/dashboard/consultas?error=no-pro");
  }

  const question = (fd.get("question") as string)?.trim();
  if (!question || question.length < 10) {
    redirect("/dashboard/consultas?error=pregunta-corta");
  }

  if (question.length > 1000) {
    redirect("/dashboard/consultas?error=pregunta-larga");
  }

  // Limit: max 3 pending queries at a time
  const pendingCount = await prisma.proQuery.count({
    where: { user_id: user.id, status: "pending" },
  });

  if (pendingCount >= 3) {
    redirect("/dashboard/consultas?error=limite-pendientes");
  }

  await prisma.proQuery.create({
    data: {
      user_id: user.id,
      question,
    },
  });

  revalidatePath("/dashboard/consultas");
  redirect("/dashboard/consultas?success=enviada");
}
