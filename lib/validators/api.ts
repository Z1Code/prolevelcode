import { z } from "zod";

export const checkoutCourseSchema = z.object({
  courseId: z.string().uuid(),
});

export const checkoutServiceSchema = z.object({
  serviceId: z.string().uuid(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  acceptance: z.object({
    noRefund: z.literal(true),
  }),
  quotedAmountCents: z.number().int().min(5000).max(5_000_000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  company: z.string().trim().max(120).optional(),
  serviceInterest: z.string().optional(),
  budgetRange: z.string().optional(),
  message: z.string().trim().min(10).max(5000),
});

export const generateTokenSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export const validateTokenSchema = z.object({
  token: z.string().min(12),
});

export const revokeTokenSchema = z.object({
  tokenId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
});


