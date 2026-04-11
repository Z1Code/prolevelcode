import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { createBunnyVideoUpload } from "@/lib/bunny/upload";
import { jsonError } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  const context = await requireApiAdmin();
  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json() as { title?: string };
  const title = body.title?.trim();

  if (!title) {
    return jsonError("Title is required", 400);
  }

  try {
    const result = await createBunnyVideoUpload(title);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/bunny/create-upload] Error:", msg);
    return jsonError("Failed to create video upload", 500, { detail: msg });
  }
}
