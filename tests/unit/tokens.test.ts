import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Mux SDK
const mockSignPlaybackId = vi.fn().mockResolvedValue("mock-jwt-token");
vi.mock("@/lib/mux", () => ({
  getMux: () => ({
    jwt: {
      signPlaybackId: (...args: unknown[]) => mockSignPlaybackId(...args),
    },
  }),
}));

// Mock Prisma
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    lesson: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    videoToken: { create: (...args: unknown[]) => mockCreate(...args) },
    tokenUsageLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { generateMuxTokens } from "@/lib/tokens/generate";

describe("generateMuxTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: "token-uuid" });
  });

  it("generates tokens correctly with active enrollment", async () => {
    mockFindFirst.mockResolvedValue({ id: "enrollment-id" });
    mockFindUnique.mockResolvedValue({ mux_playback_id: "pb-id-123", mux_status: "ready" });

    const result = await generateMuxTokens({
      userId: "user-1",
      lessonId: "lesson-1",
      courseId: "course-1",
    });

    expect(result.playbackId).toBe("pb-id-123");
    expect(result.tokens).toHaveProperty("playback");
    expect(result.tokens).toHaveProperty("thumbnail");
    expect(result.tokens).toHaveProperty("storyboard");
    expect(result.tokens).toHaveProperty("drm");
    expect(result.expiresAt).toBeDefined();

    expect(mockSignPlaybackId).toHaveBeenCalledTimes(4);
    expect(mockSignPlaybackId).toHaveBeenCalledWith("pb-id-123", { expiration: "4h", type: "video" });
    expect(mockSignPlaybackId).toHaveBeenCalledWith("pb-id-123", { expiration: "4h", type: "drm_license" });
  });

  it("throws NO_ENROLLMENT without enrollment", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      generateMuxTokens({ userId: "user-1", lessonId: "lesson-1", courseId: "course-1" }),
    ).rejects.toThrow("NO_ENROLLMENT");
  });

  it("throws VIDEO_NOT_READY if mux_status is not ready", async () => {
    mockFindFirst.mockResolvedValue({ id: "enrollment-id" });
    mockFindUnique.mockResolvedValue({ mux_playback_id: null, mux_status: "processing" });

    await expect(
      generateMuxTokens({ userId: "user-1", lessonId: "lesson-1", courseId: "course-1" }),
    ).rejects.toThrow("VIDEO_NOT_READY");
  });

  it("creates audit records (VideoToken + TokenUsageLog)", async () => {
    mockFindFirst.mockResolvedValue({ id: "enrollment-id" });
    mockFindUnique.mockResolvedValue({ mux_playback_id: "pb-id-123", mux_status: "ready" });

    await generateMuxTokens({
      userId: "user-1",
      lessonId: "lesson-1",
      courseId: "course-1",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          lesson_id: "lesson-1",
          course_id: "course-1",
        }),
      }),
    );
  });

  it("returns correct response shape", async () => {
    mockFindFirst.mockResolvedValue({ id: "enrollment-id" });
    mockFindUnique.mockResolvedValue({ mux_playback_id: "pb-id-123", mux_status: "ready" });

    const result = await generateMuxTokens({
      userId: "user-1",
      lessonId: "lesson-1",
      courseId: "course-1",
    });

    expect(result).toEqual({
      playbackId: "pb-id-123",
      tokens: {
        playback: "mock-jwt-token",
        thumbnail: "mock-jwt-token",
        storyboard: "mock-jwt-token",
        drm: "mock-jwt-token",
      },
      expiresAt: expect.any(String),
    });

    // Verify expiresAt is a valid ISO date string
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});
