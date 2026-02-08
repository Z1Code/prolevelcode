"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function updateProfile(fd: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const full_name = (fd.get("full_name") as string | null)?.trim() || null;
  const avatar_url = (fd.get("avatar_url") as string | null)?.trim() || null;

  await prisma.user.update({
    where: { id: user.id },
    data: { full_name, avatar_url },
  });

  revalidatePath("/dashboard/perfil");
  redirect("/dashboard/perfil?message=Perfil actualizado");
}
