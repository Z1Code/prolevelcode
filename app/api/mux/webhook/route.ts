import { NextResponse } from "next/server";
import { getMux } from "@/lib/mux";
import { prisma } from "@/lib/prisma";
import { requireEnv } from "@/lib/env";

export async function POST(request: Request) {
  const body = await request.text();
  const webhookSecret = requireEnv("muxWebhookSecret");

  try {
    getMux().webhooks.verifySignature(body, Object.fromEntries(request.headers), webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as { type: string; data: Record<string, unknown> };

  switch (event.type) {
    case "video.upload.asset_created": {
      const passthrough = event.data.passthrough as string | undefined;
      const assetId = (event.data.asset_id ?? (event.data as Record<string, unknown>).id) as string | undefined;
      if (passthrough && assetId) {
        await prisma.lesson.updateMany({
          where: { id: passthrough },
          data: { mux_asset_id: assetId },
        });
      }
      break;
    }

    case "video.asset.ready": {
      const assetId = event.data.id as string;
      const playbackIds = event.data.playback_ids as Array<{ id: string; policy: string }> | undefined;
      const playbackId = playbackIds?.[0]?.id;
      const passthrough = event.data.passthrough as string | undefined;

      if (playbackId) {
        const where = passthrough ? { id: passthrough } : { mux_asset_id: assetId };
        await prisma.lesson.updateMany({
          where,
          data: {
            mux_playback_id: playbackId,
            mux_status: "ready",
            thumbnail_url: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
          },
        });
      }
      break;
    }

    case "video.asset.errored": {
      const assetId = event.data.id as string;
      const passthrough = event.data.passthrough as string | undefined;
      const where = passthrough ? { id: passthrough } : { mux_asset_id: assetId };
      await prisma.lesson.updateMany({
        where,
        data: { mux_status: "error" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
