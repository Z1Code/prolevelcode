import crypto from "crypto";
import { requireEnv, env } from "@/lib/env";

interface CreateVideoResult {
  videoId: string;
  tusAuth: {
    signature: string;
    expiresAt: number;
    libraryId: string;
    videoId: string;
  };
}

/**
 * Create a video entry on Bunny Stream and return TUS upload credentials.
 * The client then uploads directly to Bunny using TUS protocol.
 */
export async function createBunnyVideoUpload(title: string): Promise<CreateVideoResult> {
  const libraryId = requireEnv("bunnyStreamLibraryId");
  const apiKey = requireEnv("bunnyStreamApiKey");

  // 1. Create video entry on Bunny
  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: "POST",
      headers: {
        "AccessKey": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bunny API error: ${response.status} ${text}`);
  }

  const video = await response.json() as { guid: string };
  const videoId = video.guid;

  // 2. Generate TUS authentication signature
  // SHA256 hash of: libraryId + apiKey + expirationTime + videoId
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
  const signaturePayload = `${libraryId}${apiKey}${expiresAt}${videoId}`;
  const signature = crypto.createHash("sha256").update(signaturePayload).digest("hex");

  return {
    videoId,
    tusAuth: {
      signature,
      expiresAt,
      libraryId,
      videoId,
    },
  };
}

/**
 * Delete a video from Bunny Stream.
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const libraryId = requireEnv("bunnyStreamLibraryId");
  const apiKey = requireEnv("bunnyStreamApiKey");

  await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: { "AccessKey": apiKey },
    },
  );
}
