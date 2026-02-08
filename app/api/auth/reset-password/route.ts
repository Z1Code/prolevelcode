import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token || !password) {
    redirect(`/recuperar?error=${encodeURIComponent("Datos inválidos")}`);
  }

  if (password.length < 8) {
    redirect(`/recuperar?token=${token}&error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}`);
  }

  if (password !== confirm) {
    redirect(`/recuperar?token=${token}&error=${encodeURIComponent("Las contraseñas no coinciden")}`);
  }

  const tokenHashValue = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token_hash: tokenHashValue },
  });

  if (!resetToken || resetToken.used_at || resetToken.expires_at < new Date()) {
    redirect(`/recuperar?error=${encodeURIComponent("Enlace expirado o inválido. Solicita uno nuevo.")}`);
  }

  const passwordHash = hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.user_id },
      data: { password_hash: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used_at: new Date() },
    }),
  ]);

  redirect("/login?message=Contraseña actualizada. Inicia sesión.");
}
