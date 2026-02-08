import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/jwt";
import { createSessionCookie } from "@/lib/auth/session";
import { bootstrapAdminRoleByEmail } from "@/lib/auth/bootstrap";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const rawNext = searchParams.get("state") ?? searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/dashboard";

  const baseUrl = request.nextUrl.origin;

  // Google OAuth callback
  if (code) {
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
          client_secret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
          redirect_uri: `${baseUrl}/auth/callback`,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenData.access_token) {
        console.error("[AUTH CALLBACK] Token exchange failed:", tokenData.error, tokenData.error_description);
        const msg = tokenData.error_description ?? "Error con Google OAuth";
        return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(msg)}`);
      }

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = (await userInfoRes.json()) as {
        id: string;
        email: string;
        name?: string;
        picture?: string;
        verified_email?: boolean;
      };

      if (!userInfo.email) {
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent("No se pudo obtener el email de Google")}`,
        );
      }

      let user = await prisma.user.findUnique({
        where: { email: userInfo.email.toLowerCase() },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userInfo.email.toLowerCase(),
            full_name: userInfo.name ?? null,
            avatar_url: userInfo.picture ?? null,
            auth_provider: "google",
            email_verified: true,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatar_url: userInfo.picture ?? user.avatar_url,
            full_name: userInfo.name ?? user.full_name,
            email_verified: true,
            last_login: new Date(),
          },
        });
      }

      await bootstrapAdminRoleByEmail(user);

      // Re-fetch to get updated role after bootstrap
      const freshUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
      const destination = freshUser?.role === "superadmin" || freshUser?.role === "admin" ? "/admin" : next;

      const response = NextResponse.redirect(`${baseUrl}${destination}`);
      await createSessionCookie(response, user.id, user.email);
      return response;
    } catch (error) {
      console.error("[AUTH CALLBACK] Google OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Error con autenticación de Google")}`,
      );
    }
  }

  // Email verification
  if (type === "verify-email" && token) {
    const tokenHash = hashToken(token);
    const verification = await prisma.emailVerificationToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!verification || verification.used_at || verification.expires_at < new Date()) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Enlace de verificación expirado o inválido")}`,
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.user_id },
        data: { email_verified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: { used_at: new Date() },
      }),
    ]);

    return NextResponse.redirect(
      `${baseUrl}/login?message=${encodeURIComponent("Email verificado. Ya puedes iniciar sesión.")}`,
    );
  }

  // Magic link login
  if (type === "magic-link" && token) {
    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.used_at || resetToken.expires_at < new Date()) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Magic link expirado o inválido")}`,
      );
    }

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used_at: new Date() },
    });

    await prisma.user.update({
      where: { id: resetToken.user_id },
      data: { email_verified: true, last_login: new Date() },
    });

    await bootstrapAdminRoleByEmail(resetToken.user);

    const freshUser = await prisma.user.findUnique({ where: { id: resetToken.user_id }, select: { role: true } });
    const destination = freshUser?.role === "superadmin" || freshUser?.role === "admin" ? "/admin" : next;

    const response = NextResponse.redirect(`${baseUrl}${destination}`);
    await createSessionCookie(response, resetToken.user_id, resetToken.user.email);
    return response;
  }

  return NextResponse.redirect(`${baseUrl}/login`);
}
