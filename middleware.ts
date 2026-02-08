import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/registro", "/recuperar"];
const COOKIE_NAME = "plc_session";

function getSecret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

async function isValidSession(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return !!payload.sub && typeof payload.sid === "string";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie) {
    const valid = await isValidSession(sessionCookie);
    if (valid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Invalid/expired cookie — clear it and let them stay on the auth page
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/registro", "/recuperar"],
};
