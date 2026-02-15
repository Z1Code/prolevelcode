"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { bootstrapAdminRoleByEmail } from "@/lib/auth/bootstrap";
import { generateToken, hashToken } from "@/lib/auth/jwt";
import { getResendClient } from "@/lib/email/resend";
import { env } from "@/lib/env";

function normalizeNext(next?: string | null) {
  if (!next || !next.startsWith("/")) return "/dashboard";
  return next;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = normalizeNext(formData.get("next")?.toString());

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email y contraseña son requeridos")}&next=${encodeURIComponent(next)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password_hash) {
    redirect(`/login?error=${encodeURIComponent("Credenciales incorrectas")}&next=${encodeURIComponent(next)}`);
  }

  if (!user.is_active) {
    redirect(`/login?error=${encodeURIComponent("Tu cuenta está desactivada")}&next=${encodeURIComponent(next)}`);
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    redirect(`/login?error=${encodeURIComponent("Credenciales incorrectas")}&next=${encodeURIComponent(next)}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  await bootstrapAdminRoleByEmail(user);

  // Re-fetch to get updated role after bootstrap
  const freshUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  const destination = freshUser?.role === "superadmin" || freshUser?.role === "admin" ? "/admin" : next;

  await createSession(user.id, user.email);
  redirect(destination);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const scholarshipToken = String(formData.get("scholarship") ?? "").trim();

  if (!email || !password) {
    redirect(`/registro?error=${encodeURIComponent("Email y contraseña son requeridos")}${scholarshipToken ? `&scholarship=${scholarshipToken}` : ""}`);
  }

  if (password.length < 8) {
    redirect(`/registro?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}${scholarshipToken ? `&scholarship=${scholarshipToken}` : ""}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/registro?error=${encodeURIComponent("Ya existe una cuenta con este email")}${scholarshipToken ? `&scholarship=${scholarshipToken}` : ""}`);
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      full_name: fullName || null,
      auth_provider: "credentials",
    },
  });

  // Auto-link scholarship if token provided
  if (scholarshipToken) {
    try {
      const scholarship = await prisma.scholarship.findUnique({
        where: { invite_token: scholarshipToken },
      });

      if (scholarship && scholarship.status === "pending") {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.scholarship.update({
          where: { id: scholarship.id },
          data: {
            recipient_user_id: user.id,
            status: "active",
            redeemed_at: now,
            expires_at: expiresAt,
          },
        });
      }
    } catch {
      // scholarship link failure shouldn't block registration
    }
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  await prisma.emailVerificationToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    const resend = getResendClient();
    const verifyUrl = `${env.appUrl}/auth/callback?type=verify-email&token=${rawToken}`;
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.com>",
      to: email,
      subject: "Verifica tu email - ProLevelCode",
      html: `
        <h2>Bienvenido a ProLevelCode</h2>
        <p>Haz clic en el siguiente enlace para verificar tu email:</p>
        <p><a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verificar email</a></p>
        <p>Este enlace expira en 24 horas.</p>
        <p>Si no creaste esta cuenta, ignora este mensaje.</p>
      `,
    });
  } catch {
    // email send failure shouldn't block registration
  }

  if (scholarshipToken) {
    redirect("/login?message=Cuenta creada y beca activada. Revisa tu email para verificar tu cuenta.");
  }

  redirect("/login?message=Cuenta creada. Revisa tu email para verificar tu cuenta.");
}

export async function magicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = normalizeNext(formData.get("next")?.toString());

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Email es requerido")}&next=${encodeURIComponent(next)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    redirect(`/login?message=${encodeURIComponent("Si tu email está registrado, recibirás un magic link")}&next=${encodeURIComponent(next)}`);
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  });

  try {
    const resend = getResendClient();
    const loginUrl = `${env.appUrl}/auth/callback?type=magic-link&token=${rawToken}&next=${encodeURIComponent(next)}`;
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.com>",
      to: email,
      subject: "Tu magic link - ProLevelCode",
      html: `
        <h2>Iniciar sesion</h2>
        <p>Haz clic en el siguiente enlace para iniciar sesion:</p>
        <p><a href="${loginUrl}" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Iniciar sesion</a></p>
        <p>Este enlace expira en 15 minutos.</p>
        <p>Si no solicitaste este enlace, ignora este mensaje.</p>
      `,
    });
  } catch {
    // silent
  }

  redirect(`/login?message=${encodeURIComponent("Si tu email está registrado, recibirás un magic link")}&next=${encodeURIComponent(next)}`);
}

export async function recoverAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect(`/recuperar?error=${encodeURIComponent("Email es requerido")}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always show success to prevent email enumeration
  if (!user) {
    redirect(`/recuperar?message=${encodeURIComponent("Si tu email está registrado, recibirás un enlace de recuperación")}`);
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  try {
    const resend = getResendClient();
    const resetUrl = `${env.appUrl}/recuperar?token=${rawToken}`;
    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.com>",
      to: email,
      subject: "Recuperar contraseña - ProLevelCode",
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Restablecer contraseña</a></p>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });
  } catch {
    // silent
  }

  redirect(`/recuperar?message=${encodeURIComponent("Si tu email está registrado, recibirás un enlace de recuperación")}`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!token || !password) {
    redirect(`/recuperar?error=${encodeURIComponent("Datos inválidos")}`);
  }

  if (password.length < 8) {
    redirect(`/recuperar?token=${token}&error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}`);
  }

  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true },
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

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
