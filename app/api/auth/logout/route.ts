import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).trim();
  const origin = request.headers.get("origin");
  if (origin && origin !== appUrl) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    await destroySession();
  } catch (error) {
    console.error("[auth/logout] failed to destroy session", error);
  }

  return NextResponse.redirect(new URL("/", appUrl), 303);
}
