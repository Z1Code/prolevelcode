import { getMux } from "@/lib/mux";
import { prisma } from "@/lib/prisma";
import type { VideoTokenResponse } from "@/lib/types";

interface GenerateMuxTokensParams {
  userId: string;
  lessonId: string;
  courseId: string;
}

export async function generateMuxTokens(params: GenerateMuxTokensParams): Promise<VideoTokenResponse> {
  const { userId, lessonId, courseId } = params;

  const enrollment = await prisma.enrollment.findFirst({
    where: { user_id: userId, course_id: courseId, status: "active" },
  });

  if (!enrollment) {
    throw new Error("NO_ENROLLMENT");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { mux_playback_id: true, mux_status: true },
  });

  if (!lesson || lesson.mux_status !== "ready" || !lesson.mux_playback_id) {
    throw new Error("VIDEO_NOT_READY");
  }

  const playbackId = lesson.mux_playback_id;
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

  const mux = getMux();
  const [playbackToken, thumbnailToken, storyboardToken, drmToken] = await Promise.all([
    mux.jwt.signPlaybackId(playbackId, { expiration: "4h", type: "video" }),
    mux.jwt.signPlaybackId(playbackId, { expiration: "4h", type: "thumbnail" }),
    mux.jwt.signPlaybackId(playbackId, { expiration: "4h", type: "storyboard" }),
    mux.jwt.signPlaybackId(playbackId, { expiration: "4h", type: "drm_license" }),
  ]);

  const videoToken = await prisma.videoToken.create({
    data: {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      expires_at: expiresAt,
    },
  });

  await prisma.tokenUsageLog.create({
    data: {
      token_id: videoToken.id,
      user_id: userId,
      action: "generated",
    },
  });

  return {
    playbackId,
    tokens: {
      playback: playbackToken,
      thumbnail: thumbnailToken,
      storyboard: storyboardToken,
      drm: drmToken,
    },
    expiresAt: expiresAt.toISOString(),
  };
}
