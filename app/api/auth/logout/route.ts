import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
}
