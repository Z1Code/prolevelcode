import { describe, expect, it } from "vitest";
import { renderSecurePlayerHtml } from "@/lib/tokens/generate";

describe("secure player html", () => {
  it("renders bunny iframe with watermark", () => {
    const html = renderSecurePlayerHtml({
      bunnyEmbedUrl: "https://iframe.mediadelivery.net/embed/123/abc",
      userEmail: "user@example.com",
      title: "Lesson 1",
      remaining: 2,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    expect(html).toContain("iframe.mediadelivery.net");
    expect(html).toContain("user@example.com");
    expect(html).toContain("Lesson 1");
  });
});
