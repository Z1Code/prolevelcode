import { cookies } from "next/headers";
import { firebaseAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "plc_session";
const SESSION_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;

export async function createSessionCookieFromIdToken(idToken: string) {
  return firebaseAdminAuth.createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS });
}

export async function setServerSessionCookie(idToken: string) {
  const cookieStore = await cookies();
  const sessionCookie = await createSessionCookieFromIdToken(idToken);

  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearServerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getServerSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getServerAuthUser() {
  const sessionCookie = await getServerSessionCookie();

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);

    return {
      id: decoded.uid,
      email: decoded.email ?? null,
      full_name: typeof decoded.name === "string" ? decoded.name : null,
      avatar_url: typeof decoded.picture === "string" ? decoded.picture : null,
    };
  } catch {
    return null;
  }
}
