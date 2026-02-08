import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentAppUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[auth/session] failed to resolve current user", error);
    return NextResponse.json({ user: null });
  }
}
