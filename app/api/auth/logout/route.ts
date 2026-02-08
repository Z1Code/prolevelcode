import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    await destroySession();
  } catch (error) {
    console.error("[auth/logout] failed to destroy session", error);
  }

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
}
