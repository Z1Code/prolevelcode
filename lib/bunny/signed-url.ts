import crypto from "crypto";
import { env } from "@/lib/env";

/**
 * Generate a signed token for Bunny Stream embed URLs.
 * Uses HMAC-SHA256 with the library's token authentication key.
 */
export function generateBunnySignedToken(
  libraryId: string,
  videoId: string,
  expiresAt: number,
  tokenKey: string,
): string {
  const hashableBase = `${tokenKey}${videoId}${expiresAt}`;
  const hash = crypto.createHash("sha256").update(hashableBase).digest("hex");
  return hash;
}

/**
 * Build a signed Bunny Stream embed URL.
 */
export function getBunnyEmbedUrl(videoId: string): {
  url: string;
  token: string;
  expires: number;
} {
  const libraryId = env.bunnyStreamLibraryId;
  const tokenKey = env.bunnyStreamTokenKey;

  if (!libraryId || !tokenKey) {
    throw new Error("Bunny Stream configuration missing");
  }

  // Token valid for 4 hours
  const expires = Math.floor(Date.now() / 1000) + 4 * 60 * 60;
  const token = generateBunnySignedToken(libraryId, videoId, expires, tokenKey);

  const url = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

  return { url, token, expires };
}

/**
 * Get Bunny Stream thumbnail URL for a video.
 */
export function getBunnyThumbnailUrl(videoId: string): string {
  const libraryId = env.bunnyStreamLibraryId;
  const cdnHost = env.bunnyStreamCdnHost;

  if (cdnHost) {
    return `https://${cdnHost}/${videoId}/thumbnail.jpg`;
  }

  if (libraryId) {
    return `https://vz-${libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
  }

  return "";
}
