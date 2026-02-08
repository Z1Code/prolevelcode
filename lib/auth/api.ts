import { prisma } from "@/lib/prisma";
import { getSessionUser } from "./session";

export async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return { user };
}

export async function requireApiAdmin() {
  const context = await requireApiUser();
  if (!context) return null;

  const appUser = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { id: true, role: true, is_active: true },
  });

  if (!appUser || !appUser.is_active || !["admin", "superadmin"].includes(appUser.role)) {
    return null;
  }

  return {
    ...context,
    appUser,
  };
}
