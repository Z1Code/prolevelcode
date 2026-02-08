import { describe, expect, it } from "vitest";
import { checkoutCourseSchema, generateTokenSchema } from "@/lib/validators/api";

describe("api validators", () => {
  it("validates checkout course payload", () => {
    const payload = { courseId: "d0b737d0-10cd-4c54-95eb-d5fb93f73f06" };
    const parsed = checkoutCourseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid token generation payload", () => {
    const parsed = generateTokenSchema.safeParse({ lessonId: "x", courseId: "y" });
    expect(parsed.success).toBe(false);
  });
});
