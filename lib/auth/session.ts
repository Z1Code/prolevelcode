import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, verifySessionToken, generateToken, hashToken } from "./jwt";
import type { AppUser, UserRole } from "@/lib/types";

export const SESSION_COOKIE_NAME = "plc_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function createSession(userId: string, email: string) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  const session = await prisma.session.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  const jwt = await signSessionToken({
    sub: userId,
    email,
    sid: session.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwt, buildCookieOptions());

  return jwt;
}

export async function createSessionCookie(response: NextResponse, userId: string, email: string) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  const session = await prisma.session.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  const jwt = await signSessionToken({
    sub: userId,
    email,
    sid: session.id,
  });

  response.cookies.set(SESSION_COOKIE_NAME, jwt, buildCookieOptions());
  return jwt;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.sid) {
      await prisma.session.deleteMany({ where: { id: payload.sid } });
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }

  return { id: payload.sub, email: payload.email };
}

export async function requireAuth(redirectTo = "/login"): Promise<{ id: string; email: string }> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`${redirectTo}?next=${encodeURIComponent("/dashboard")}`);
  }
  return user;
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const appUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      role: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!appUser) return null;

  return {
    id: appUser.id,
    email: appUser.email,
    full_name: appUser.full_name,
    avatar_url: appUser.avatar_url,
    role: appUser.role as UserRole,
    is_active: appUser.is_active,
    created_at: appUser.created_at.toISOString(),
    updated_at: appUser.updated_at.toISOString(),
  };
}

export async function requireRole(roles: UserRole[]): Promise<AppUser> {
  const appUser = await getCurrentAppUser();
  if (!appUser || !roles.includes(appUser.role)) {
    redirect("/");
  }
  return appUser;
}
