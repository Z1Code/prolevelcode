import { prisma } from "@/lib/prisma";

export interface AdminLatestSale {
  id: string;
  amount_paid_cents: number | null;
  currency: string;
  enrolled_at: Date;
  user: { email: string };
  course: { title: string };
}

export interface AdminLatestToken {
  id: string;
  token: string;
  current_views: number;
  max_views: number;
  expires_at: Date;
  user: { email: string };
  lesson: { title: string };
}

export interface AdminMetricsData {
  monthlyRevenueCLP: number;
  monthlyRevenueUSD: number;
  clpToUsdRate: number;
  newUsers: number;
  activeCourses: number;
  activeTokens: number;
  latestSales: AdminLatestSale[];
  latestTokens: AdminLatestToken[];
}

export async function getAdminMetrics(): Promise<AdminMetricsData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch CLP→USD rate (fallback to ~950 if API fails)
  let clpToUsdRate = 950;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    const data = await res.json() as { result: string; rates?: { CLP?: number } };
    if (data.result === "success" && data.rates?.CLP) {
      clpToUsdRate = data.rates.CLP;
    }
  } catch {
    // use fallback
  }

  const [monthlyEnrollments, newUsers, activeCourses, activeTokens, latestSales, latestTokens] = await Promise.all([
    prisma.enrollment.findMany({
      where: { enrolled_at: { gte: monthStart } },
      select: { amount_paid_cents: true, currency: true },
    }),
    prisma.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    prisma.course.count({ where: { is_published: true } }),
    prisma.videoToken.count({ where: { is_revoked: false, expires_at: { gt: now } } }),
    prisma.enrollment.findMany({
      orderBy: { enrolled_at: "desc" },
      take: 8,
      select: {
        id: true,
        amount_paid_cents: true,
        currency: true,
        enrolled_at: true,
        user: { select: { email: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.videoToken.findMany({
      where: { is_revoked: false, expires_at: { gt: now } },
      orderBy: { created_at: "desc" },
      take: 8,
      select: {
        id: true,
        token: true,
        current_views: true,
        max_views: true,
        expires_at: true,
        user: { select: { email: true } },
        lesson: { select: { title: true } },
      },
    }),
  ]);

  let monthlyRevenueCLP = 0;
  let monthlyRevenueUSD = 0;
  for (const item of monthlyEnrollments) {
    const cents = item.amount_paid_cents ?? 0;
    if (item.currency === "CLP") {
      monthlyRevenueCLP += cents;
    } else {
      monthlyRevenueUSD += cents;
    }
  }

  return {
    monthlyRevenueCLP,
    monthlyRevenueUSD,
    clpToUsdRate,
    newUsers,
    activeCourses,
    activeTokens,
    latestSales: latestSales as AdminLatestSale[],
    latestTokens: latestTokens as AdminLatestToken[],
  };
}
