import { prisma } from "@/lib/prisma";

export interface AccessResult {
  granted: boolean;
  reason: "pro_tier" | "basic_tier" | "scholarship" | "no_access";
}

/**
 * Central access-control check.
 *
 * Priority:
 * 1. Active Pro tier purchase → ALL courses
 * 2. Active Basic tier purchase → basic-tier courses only
 * 3. Active scholarship (not expired) → basic-tier courses only
 * 4. Otherwise → no access
 */
export async function checkCourseAccess(userId: string, courseId: string): Promise<AccessResult> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { tier_access: true },
  });

  if (!course) {
    return { granted: false, reason: "no_access" };
  }

  // 1. Active Pro tier → all courses
  const proTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: userId,
      tier: "pro",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (proTier) {
    return { granted: true, reason: "pro_tier" };
  }

  // 2. Active Basic tier → basic courses only
  const basicTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: userId,
      tier: "basic",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (basicTier && course.tier_access === "basic") {
    return { granted: true, reason: "basic_tier" };
  }

  // 3. Active scholarship → basic courses only
  const scholarship = await prisma.scholarship.findFirst({
    where: {
      recipient_user_id: userId,
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (scholarship && course.tier_access === "basic") {
    return { granted: true, reason: "scholarship" };
  }

  return { granted: false, reason: "no_access" };
}

/**
 * Returns the user's highest active tier, or null if none.
 */
export async function getUserTier(userId: string): Promise<"pro" | "basic" | null> {
  const proTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: userId,
      tier: "pro",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (proTier) return "pro";

  const basicTier = await prisma.tierPurchase.findFirst({
    where: {
      user_id: userId,
      tier: "basic",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (basicTier) return "basic";

  const scholarship = await prisma.scholarship.findFirst({
    where: {
      recipient_user_id: userId,
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (scholarship) return "basic";

  return null;
}
