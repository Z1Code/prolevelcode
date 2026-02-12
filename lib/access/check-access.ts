import { prisma } from "@/lib/prisma";

export interface AccessResult {
  granted: boolean;
  reason: "enrollment" | "pro_tier" | "basic_tier" | "scholarship" | "no_access";
}

/**
 * Central access-control check. Replaces all inline enrollment queries.
 *
 * Priority:
 * 1. Direct enrollment (active) → granted
 * 2. Active Pro tier purchase → ALL courses
 * 3. Active Basic tier purchase → basic-tier courses only
 * 4. Active scholarship (not expired) → basic-tier courses only
 * 5. Otherwise → no access
 */
export async function checkCourseAccess(userId: string, courseId: string): Promise<AccessResult> {
  // 1. Direct enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { user_id: userId, course_id: courseId, status: "active" },
    select: { id: true },
  });

  if (enrollment) {
    return { granted: true, reason: "enrollment" };
  }

  // Fetch course tier requirement
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { tier_access: true },
  });

  if (!course) {
    return { granted: false, reason: "no_access" };
  }

  // 2. Active Pro tier → all courses
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

  // 3. Active Basic tier → basic courses only
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

  // 4. Active scholarship → basic courses only
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

  // Check active scholarship → counts as basic
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
