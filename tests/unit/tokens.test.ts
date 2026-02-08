import { describe, expect, it } from "vitest";
import { renderSecurePlayerHtml } from "@/lib/tokens/generate";

describe("secure player html", () => {
  it("renders watermark and youtube-nocookie", () => {
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
  });
});
