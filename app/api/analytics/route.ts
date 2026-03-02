import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const propertyId = process.env.GA_PROPERTY_ID;

function resolveStartDate(range: string): string {
  switch (range) {
    case "1d":
      return "1daysAgo";
    case "7d":
      return "7daysAgo";
    case "30d":
      return "30daysAgo";
    case "ytd": {
      const now = new Date();
      return `${now.getFullYear()}-01-01`;
    }
    default:
      return "30daysAgo";
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "admin" || user?.role === "superadmin";
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !(await isAdmin(sessionUser.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "overview";
    const range = searchParams.get("range") || "30d";
    const startDate = resolveStartDate(range);

    if (!propertyId || !process.env.GA_CLIENT_EMAIL || !process.env.GA_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Google Analytics no configurado. Agrega GA_PROPERTY_ID, GA_CLIENT_EMAIL y GA_PRIVATE_KEY al .env" },
        { status: 500 },
      );
    }

    switch (metric) {
      case "overview":
        return await getOverviewMetrics(startDate);
      case "realtime":
        return await getRealtimeMetrics();
      case "pages":
        return await getTopPages(startDate);
      case "devices":
        return await getDeviceMetrics(startDate);
      case "locations":
        return await getLocationMetrics(startDate);
      default:
        return NextResponse.json({ error: "Métrica no válida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error en Analytics API:", error);
    return NextResponse.json({ error: "Error obteniendo datos de Analytics" }, { status: 500 });
  }
}

async function getOverviewMetrics(startDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });

  let totalUsers = 0;
  let totalSessions = 0;
  let totalPageViews = 0;
  let totalDuration = 0;
  let totalBounceRate = 0;

  const dailyData =
    response.rows?.map((row) => {
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const pageViews = parseInt(row.metricValues?.[2]?.value || "0");
      const duration = parseFloat(row.metricValues?.[3]?.value || "0");
      const bounceRate = parseFloat(row.metricValues?.[4]?.value || "0");

      totalUsers += users;
      totalSessions += sessions;
      totalPageViews += pageViews;
      totalDuration += duration;
      totalBounceRate += bounceRate;

      return {
        date: row.dimensionValues?.[0]?.value,
        users,
        sessions,
        pageViews,
        avgDuration: duration,
        bounceRate,
      };
    }) || [];

  const rowCount = response.rows?.length || 1;

  return NextResponse.json({
    summary: {
      totalUsers,
      totalSessions,
      totalPageViews,
      avgSessionDuration: totalDuration / rowCount,
      avgBounceRate: totalBounceRate / rowCount,
    },
    dailyData,
  });
}

async function getRealtimeMetrics() {
  const [response] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${propertyId}`,
    metrics: [{ name: "activeUsers" }],
  });

  return NextResponse.json({
    activeUsers: parseInt(response.rows?.[0]?.metricValues?.[0]?.value || "0"),
  });
}

async function getTopPages(startDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  const pathToTitle: Record<string, string> = {
    "/": "ProLevelCode - Inicio",
    "/login": "Iniciar Sesión",
    "/register": "Registro",
    "/dashboard": "Dashboard",
    "/cursos": "Cursos",
    "/precios": "Precios",
  };

  const pages =
    response.rows?.map((row) => {
      const rawTitle = row.dimensionValues?.[0]?.value;
      const path = row.dimensionValues?.[1]?.value || "/";
      let title = rawTitle;
      if (!rawTitle || rawTitle === "(not set)") {
        title = pathToTitle[path] || path;
      }
      return {
        title,
        path,
        views: parseInt(row.metricValues?.[0]?.value || "0"),
        avgDuration: parseFloat(row.metricValues?.[1]?.value || "0"),
      };
    }) || [];

  return NextResponse.json({ pages });
}

async function getDeviceMetrics(startDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
  });

  const devices =
    response.rows?.map((row) => ({
      device: row.dimensionValues?.[0]?.value,
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    })) || [];

  return NextResponse.json({ devices });
}

async function getLocationMetrics(startDate: string) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "city" }, { name: "country" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 50,
  });

  const locations = (
    response.rows?.map((row) => ({
      city: row.dimensionValues?.[0]?.value,
      country: row.dimensionValues?.[1]?.value,
      users: parseInt(row.metricValues?.[0]?.value || "0"),
    })) || []
  ).filter((loc) => loc.city !== "(not set)" && loc.country !== "(not set)");

  return NextResponse.json({ locations });
}
