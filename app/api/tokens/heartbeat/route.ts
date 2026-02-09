import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  const context = await requireApiUser();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tokenId = typeof body?.tokenId === "string" ? body.tokenId : null;
  const fingerprint = typeof body?.fingerprint === "string" ? body.fingerprint : null;

  if (!tokenId || !fingerprint) {
    return NextResponse.json({ error: "Missing tokenId or fingerprint" }, { status: 400 });
  }

  // Clean up stale sessions for this user (opportunistic cleanup)
  await prisma.activeVideoSession.deleteMany({
    where: {
      user_id: context.user.id,
      last_heartbeat: { lt: new Date(Date.now() - STALE_THRESHOLD_MS) },
    },
  });

  // Find the active session for this token
  const session = await prisma.activeVideoSession.findUnique({
    where: { token_id: tokenId },
  });

  if (!session) {
    return NextResponse.json({ active: false, reason: "no_session" });
  }

  // Check this session belongs to the requesting user
  if (session.user_id !== context.user.id) {
    return NextResponse.json({ active: false, reason: "unauthorized" }, { status: 403 });
  }

  // First heartbeat after video load: session was created with placeholder
  // fingerprint (ip_*). Register the real browser fingerprint.
  const isPlaceholder = session.fingerprint.startsWith("ip_");

  if (!isPlaceholder && session.fingerprint !== fingerprint) {
    await prisma.activeVideoSession.delete({ where: { id: session.id } });
    return NextResponse.json({ active: false, reason: "fingerprint_mismatch" });
  }

  // Update heartbeat (and register real fingerprint on first beat)
  await prisma.activeVideoSession.update({
    where: { id: session.id },
    data: {
      last_heartbeat: new Date(),
      ...(isPlaceholder ? { fingerprint } : {}),
    },
  });

  return NextResponse.json({ active: true });
}
