import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { testimonial_dismissed_at: new Date() },
  });

  return NextResponse.json({ ok: true });
}
