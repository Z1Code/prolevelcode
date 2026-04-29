import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import { prisma } from "@/lib/prisma";
import { getBunnyEmbedUrl, getBunnyThumbnailUrl } from "@/lib/bunny/signed-url";
import { ProyectosClient } from "./proyectos-client";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const user = await requireAuth();
  const tier = await getUserTier(user.id);

  if (tier !== "pro") {
    redirect("/dashboard/plan");
  }

  const projects = await prisma.showcaseProject.findMany({
    where: { is_published: true },
    orderBy: { sort_order: "asc" },
    include: {
      videos: {
        where: { is_published: true },
        orderBy: { sort_order: "asc" },
      },
    },
  });

  // Pre-compute signed embed URLs for all videos
  const embedUrls: Record<string, string> = {};
  for (const project of projects) {
    for (const video of project.videos) {
      try {
        embedUrls[video.bunny_video_id] = getBunnyEmbedUrl(video.bunny_video_id).url;
      } catch {
        // skip if Bunny not configured
      }
    }
  }

  const serialized = projects.map((p) => ({
    ...p,
    created_at: p.created_at.toISOString(),
    videos: p.videos.map((v) => ({
      ...v,
      created_at: v.created_at.toISOString(),
      bunny_thumbnail_url: v.bunny_thumbnail_url || getBunnyThumbnailUrl(v.bunny_video_id),
    })),
  }));

  return <ProyectosClient projects={serialized} embedUrls={embedUrls} />;
}
