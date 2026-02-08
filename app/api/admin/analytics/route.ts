import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { getAdminMetrics } from "@/lib/utils/admin-data";

export async function GET() {
  const context = await requireApiAdmin();
  if (!context) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await getAdminMetrics();
  return NextResponse.json(metrics);
}


