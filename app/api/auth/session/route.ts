import { NextResponse } from "next/server";
import { firebaseAdminAuth, firebaseAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { env } from "@/lib/env";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

async function ensureUserProfile(decodedToken: { uid: string; email?: string; name?: string; picture?: string }) {
  const userRef = firebaseAdminDb.collection("users").doc(decodedToken.uid);
  const existing = await userRef.get();
  const existingData = existing.data() as Record<string, unknown> | undefined;
  const isAdmin = env.adminEmails.includes((decodedToken.email ?? "").toLowerCase());

  const payload: Record<string, unknown> = {
    email: decodedToken.email ?? "",
    full_name: decodedToken.name ?? null,
    avatar_url: decodedToken.picture ?? null,
    role: isAdmin ? "superadmin" : existingData?.role ?? "student",
    is_active: existingData?.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (!existing.exists) {
    payload.created_at = new Date().toISOString();
  }

  await userRef.set(payload, { merge: true });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { idToken?: string };

    if (!payload.idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decodedIdToken = await firebaseAdminAuth.verifyIdToken(payload.idToken);
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(payload.idToken, {
      expiresIn: SESSION_MAX_AGE_SEC * 1000,
    });

    await ensureUserProfile({
      uid: decodedIdToken.uid,
      email: decodedIdToken.email,
      name: typeof decodedIdToken.name === "string" ? decodedIdToken.name : undefined,
      picture: typeof decodedIdToken.picture === "string" ? decodedIdToken.picture : undefined,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, buildCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create Firebase session",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
  return response;
}
