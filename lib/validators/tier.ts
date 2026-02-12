import { z } from "zod";

export const checkoutTierSchema = z.object({
  tier: z.enum(["basic", "pro"]),
});

export const grantScholarshipSchema = z.object({
  tierPurchaseId: z.string().uuid(),
  recipientEmail: z.string().email(),
});

export const redeemScholarshipSchema = z.object({
  token: z.string().min(16).max(64),
});
