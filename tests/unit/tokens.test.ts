import { describe, expect, it } from "vitest";
import { renderSecurePlayerHtml } from "@/lib/tokens/generate";

describe("secure player html", () => {
  it("renders watermark, uses nocookie host, and obfuscates video id", () => {
    const html = renderSecurePlayerHtml({
      youtubeId: "abc123",
      userEmail: "user@example.com",
      title: "Lesson 1",
      remaining: 2,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tokenId: "test-token-id",
      heartbeatUrl: "/api/tokens/heartbeat",
    });

    expect(html).toContain("youtube-nocookie.com");
    expect(html).toContain("user@example.com");
    // YouTube ID should NOT appear in plaintext
    expect(html).not.toContain("abc123");
    // Should use IFrame API, not a static iframe src
    expect(html).toContain("YT.Player");
    // Should have share-blocking overlays
    expect(html).toContain("yt-block-top");
    expect(html).toContain("yt-block-logo");
  });
});
