import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function bootstrapAdminRoleByEmail(user: { id: string; email?: string | null }) {
  const email = user.email?.toLowerCase().trim();
  if (!email || !env.adminEmails.includes(email)) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "superadmin" },
  });
}
