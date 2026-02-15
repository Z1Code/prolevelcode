import { prisma } from "@/lib/prisma";

export interface AdminLatestSale {
  id: string;
  tier: string;
  amount_paid_cents: number;
  currency: string;
  purchased_at: Date;
  user: { email: string };
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
  totalClpCents: number;
  totalUsdCents: number;
  monthlyClpCents: number;
  monthlyUsdCents: number;
  clpPerUsd: number;
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

  // Emails to exclude from revenue metrics (unprocessed payments)
  const excludedEmails = ["geordonez77@gmail.com"];
  const purchaseWhere = { status: "active" as const, user: { email: { notIn: excludedEmails } } };

  const [allPurchases, monthlyPurchases, newUsers, activeCourses, activeTokens, latestSales, latestTokens] = await Promise.all([
    prisma.tierPurchase.findMany({
      where: purchaseWhere,
      select: { amount_paid_cents: true, currency: true },
    }),
    prisma.tierPurchase.findMany({
      where: { ...purchaseWhere, purchased_at: { gte: monthStart } },
      select: { amount_paid_cents: true, currency: true },
    }),
    prisma.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    prisma.course.count({ where: { is_published: true } }),
    prisma.videoToken.count({ where: { is_revoked: false, expires_at: { gt: now } } }),
    prisma.tierPurchase.findMany({
      where: purchaseWhere,
      orderBy: { purchased_at: "desc" },
      take: 8,
      select: {
        id: true,
        tier: true,
        amount_paid_cents: true,
        currency: true,
        purchased_at: true,
        user: { select: { email: true } },
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

  const isUsdLike = (c: string) => c === "USD" || c === "USDT";

  let totalClpCents = 0;
  let totalUsdCents = 0;
  for (const item of allPurchases) {
    const cents = item.amount_paid_cents ?? 0;
    if (isUsdLike(item.currency)) {
      totalUsdCents += cents;
    } else {
      totalClpCents += cents;
    }
  }

  let monthlyClpCents = 0;
  let monthlyUsdCents = 0;
  for (const item of monthlyPurchases) {
    const cents = item.amount_paid_cents ?? 0;
    if (isUsdLike(item.currency)) {
      monthlyUsdCents += cents;
    } else {
      monthlyClpCents += cents;
    }
  }

  return {
    totalClpCents,
    totalUsdCents,
    monthlyClpCents,
    monthlyUsdCents,
    clpPerUsd: clpToUsdRate,
    newUsers,
    activeCourses,
    activeTokens,
    latestSales: latestSales as AdminLatestSale[],
    latestTokens: latestTokens as AdminLatestToken[],
  };
}
