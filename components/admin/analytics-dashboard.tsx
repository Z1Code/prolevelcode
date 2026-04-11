"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "/data/world-110m.json";

const COUNTRY_TO_ISO3: Record<string, string> = {
  Chile: "CHL", "United States": "USA", Peru: "PER", Argentina: "ARG",
  Colombia: "COL", Mexico: "MEX", Brazil: "BRA", Spain: "ESP",
  Germany: "DEU", France: "FRA", "United Kingdom": "GBR", Italy: "ITA",
  Canada: "CAN", Australia: "AUS", Japan: "JPN", China: "CHN",
  India: "IND", "South Korea": "KOR", Netherlands: "NLD", Sweden: "SWE",
  Portugal: "PRT", Switzerland: "CHE", Belgium: "BEL", Austria: "AUT",
  Poland: "POL", Norway: "NOR", Denmark: "DNK", Finland: "FIN",
  Ireland: "IRL", "New Zealand": "NZL", "Czech Republic": "CZE",
  Romania: "ROU", Hungary: "HUN", Greece: "GRC", Turkey: "TUR",
  Israel: "ISR", "South Africa": "ZAF", Egypt: "EGY", Nigeria: "NGA",
  Kenya: "KEN", Thailand: "THA", Vietnam: "VNM", Indonesia: "IDN",
  Philippines: "PHL", Malaysia: "MYS", Singapore: "SGP", Taiwan: "TWN",
  Russia: "RUS", Ukraine: "UKR", Bolivia: "BOL", Ecuador: "ECU",
  Paraguay: "PRY", Uruguay: "URY", Venezuela: "VEN",
  "Costa Rica": "CRI", Panama: "PAN", Guatemala: "GTM",
  "Dominican Republic": "DOM", "Puerto Rico": "PRI", Cuba: "CUB",
  Honduras: "HND", "El Salvador": "SLV", Nicaragua: "NIC",
  "Saudi Arabia": "SAU", "United Arab Emirates": "ARE",
};

const NUMERIC_TO_ISO3: Record<string, string> = {
  "152": "CHL", "840": "USA", "604": "PER", "032": "ARG",
  "170": "COL", "484": "MEX", "076": "BRA", "724": "ESP",
  "276": "DEU", "250": "FRA", "826": "GBR", "380": "ITA",
  "124": "CAN", "036": "AUS", "392": "JPN", "156": "CHN",
  "356": "IND", "410": "KOR", "528": "NLD", "752": "SWE",
  "620": "PRT", "756": "CHE", "056": "BEL", "040": "AUT",
  "616": "POL", "578": "NOR", "208": "DNK", "246": "FIN",
  "372": "IRL", "554": "NZL", "203": "CZE", "642": "ROU",
  "348": "HUN", "300": "GRC", "792": "TUR", "376": "ISR",
  "710": "ZAF", "818": "EGY", "566": "NGA", "404": "KEN",
  "764": "THA", "704": "VNM", "360": "IDN", "608": "PHL",
  "458": "MYS", "702": "SGP", "158": "TWN", "643": "RUS",
  "804": "UKR", "068": "BOL", "218": "ECU", "600": "PRY",
  "858": "URY", "862": "VEN", "188": "CRI", "591": "PAN",
  "320": "GTM", "214": "DOM", "630": "PRI", "192": "CUB",
};

const CITY_COORDS: Record<string, [number, number]> = {
  Santiago: [-70.65, -33.45], "Vina del Mar": [-71.55, -33.02],
  Antofagasta: [-70.4, -23.65], "Puerto Montt": [-72.94, -41.47],
  Maipu: [-70.76, -33.51], Concepcion: [-73.05, -36.83],
  Valparaiso: [-71.63, -33.05], Temuco: [-72.6, -38.74],
  Rancagua: [-70.74, -34.17], Iquique: [-70.14, -20.21],
  "La Serena": [-71.25, -29.9], Talca: [-71.66, -35.43],
  Lima: [-77.03, -12.04], Bogota: [-74.07, 4.71],
  "Buenos Aires": [-58.38, -34.6], "Mexico City": [-99.13, 19.43],
  "Sao Paulo": [-46.63, -23.55], Madrid: [-3.7, 40.42],
  Barcelona: [2.17, 41.39], Berlin: [13.4, 52.52],
  London: [-0.12, 51.51], Paris: [2.35, 48.86],
  Rome: [12.5, 41.9], Toronto: [-79.38, 43.65],
  "New York": [-74.01, 40.71], "Los Angeles": [-118.24, 34.05],
  Miami: [-80.19, 25.76], Chicago: [-87.63, 41.88],
  Houston: [-95.37, 29.76], Ashburn: [-77.49, 39.04],
  "San Francisco": [-122.42, 37.78], Sydney: [151.21, -33.87],
  Melbourne: [144.96, -37.81], Tokyo: [139.69, 35.69],
  Seoul: [126.98, 37.57], Beijing: [116.4, 28.23],
  Mumbai: [72.88, 19.08], Delhi: [77.21, 28.61],
  Bangalore: [77.59, 12.97], Singapore: [103.85, 1.29],
  Bangkok: [100.5, 13.76], Amsterdam: [4.9, 52.37],
  Stockholm: [18.07, 59.33], Lisbon: [-9.14, 38.74],
  Zurich: [8.54, 47.38], Vienna: [16.37, 48.21],
  Prague: [14.42, 50.08], Warsaw: [21.01, 52.23],
  Helsinki: [24.94, 60.17], Dublin: [-6.26, 53.35],
  Quito: [-78.52, -0.18], "La Paz": [-68.15, -16.5],
  Asuncion: [-57.58, -25.26], Montevideo: [-56.16, -34.88],
  Caracas: [-66.9, 10.5], "San Jose": [-84.08, 9.93],
  Medellin: [-75.56, 6.25], Guayaquil: [-79.9, -2.19],
  "Guatemala City": [-90.53, 14.63], "Panama City": [-79.52, 8.98],
  "Santo Domingo": [-69.94, 18.49], Havana: [-82.37, 23.11],
};

interface AnalyticsData {
  summary?: {
    totalUsers: number;
    totalSessions: number;
    totalPageViews: number;
    avgSessionDuration: number;
    avgBounceRate: number;
  };
  dailyData?: Array<{
    date: string;
    users: number;
    sessions: number;
    pageViews: number;
  }>;
}

interface PageData {
  pages: Array<{ title: string; path: string; views: number; avgDuration: number }>;
}
interface DeviceData {
  devices: Array<{ device: string; users: number; sessions: number }>;
}
interface LocationData {
  locations: Array<{ city: string; country: string; users: number }>;
}

type TimeRange = "1d" | "7d" | "30d" | "ytd";

const TIME_RANGES: { id: TimeRange; label: string; description: string }[] = [
  { id: "1d", label: "1D", description: "Hoy" },
  { id: "7d", label: "7D", description: "7 dias" },
  { id: "30d", label: "30D", description: "30 dias" },
  { id: "ytd", label: "YTD", description: "Año actual" },
];

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsData>({});
  const [realtime, setRealtime] = useState({ activeUsers: 0 });
  const [topPages, setTopPages] = useState<PageData>({ pages: [] });
  const [devices, setDevices] = useState<DeviceData>({ devices: [] });
  const [locations, setLocations] = useState<LocationData>({ locations: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [chartMetric, setChartMetric] = useState<"users" | "sessions" | "pageViews">("users");

  const fetchAnalytics = useCallback(async (range: TimeRange) => {
    try {
      setIsLoading(true);
      setError(null);

      const [overviewRes, realtimeRes, pagesRes, devicesRes, locationsRes] = await Promise.all([
        fetch(`/api/analytics?metric=overview&range=${range}`),
        fetch("/api/analytics?metric=realtime"),
        fetch(`/api/analytics?metric=pages&range=${range}`),
        fetch(`/api/analytics?metric=devices&range=${range}`),
        fetch(`/api/analytics?metric=locations&range=${range}`),
      ]);

      if (!overviewRes.ok) {
        const data = await overviewRes.json();
        throw new Error(data.error || "Error cargando analytics");
      }

      setOverview(await overviewRes.json());
      if (realtimeRes.ok) setRealtime(await realtimeRes.json());
      if (pagesRes.ok) setTopPages(await pagesRes.json());
      if (devicesRes.ok) setDevices(await devicesRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange);
    const interval = setInterval(() => fetchAnalytics(timeRange), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange, fetchAnalytics]);

  const rangeLabel = TIME_RANGES.find((r) => r.id === timeRange)?.description || "30 dias";

  const countryUserMap = useMemo(() => {
    const map: Record<string, number> = {};
    locations.locations.forEach((loc) => {
      const iso3 = COUNTRY_TO_ISO3[loc.country];
      if (iso3) map[iso3] = (map[iso3] || 0) + loc.users;
    });
    return map;
  }, [locations]);

  const maxCountryUsers = useMemo(
    () => Math.max(...Object.values(countryUserMap), 1),
    [countryUserMap],
  );

  const deviceStats = useMemo(() => {
    const total = devices.devices.reduce((s, d) => s + d.users, 0);
    return devices.devices.map((d) => ({
      ...d,
      pct: total > 0 ? ((d.users / total) * 100).toFixed(0) : "0",
      icon:
        d.device === "mobile" ? "mobile" : d.device === "desktop" ? "desktop" : "tablet",
    }));
  }, [devices]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 stagger-enter">
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="liquid-surface animate-pulse p-4">
              <div className="mb-2 h-3 w-16 rounded bg-white/10" />
              <div className="h-7 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
        {/* Skeleton chart */}
        <div className="liquid-surface animate-pulse p-6">
          <div className="mb-4 h-4 w-40 rounded bg-white/10" />
          <div className="h-48 rounded bg-white/5" />
        </div>
        {/* Skeleton map + pages */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="liquid-surface animate-pulse p-6">
            <div className="h-64 rounded bg-white/5" />
          </div>
          <div className="liquid-surface animate-pulse p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liquid-surface border-red-500/20 p-8 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-red-300">{error}</p>
        <p className="mt-2 text-xs text-slate-500">
          Configura las variables GA_PROPERTY_ID, GA_CLIENT_EMAIL y GA_PRIVATE_KEY en tu .env
        </p>
        <button
          onClick={() => fetchAnalytics(timeRange)}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs text-white transition-colors hover:bg-white/15"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const allDays = overview.dailyData || [];
  const days =
    timeRange === "1d" ? allDays.slice(-1) : timeRange === "7d" ? allDays.slice(-7) : allDays;

  const chartW = 700;
  const chartH = 180;
  const padX = 30;
  const padY = 20;

  const maxVal = Math.max(...days.map((d) => d[chartMetric]), 1);

  // Smooth bezier path
  const points = days.map((day, i) => ({
    x: days.length > 1 ? padX + (i / (days.length - 1)) * (chartW - padX * 2) : chartW / 2,
    y: padY + (1 - day[chartMetric] / maxVal) * (chartH - padY * 2),
    ...day,
  }));

  // Monotone cubic interpolation for smooth curves
  const buildSmoothPath = () => {
    if (points.length < 2) return "";
    if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath();
  const areaPath =
    points.length > 1
      ? linePath +
        ` L${points[points.length - 1].x},${chartH} L${points[0].x},${chartH} Z`
      : "";

  // Bar chart data for devices
  const totalDeviceUsers = deviceStats.reduce((s, d) => s + d.users, 0);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Realtime badge */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              {realtime.activeUsers} en linea
            </span>
          </div>
          {/* Device badges */}
          <div className="flex items-center gap-1.5">
            {deviceStats.map((d, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300"
                title={`${d.device}: ${d.users} usuarios`}
              >
                <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {d.icon === "mobile" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  ) : d.icon === "desktop" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                  )}
                </svg>
                {d.pct}%
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex overflow-hidden rounded-lg border border-white/[0.08]">
            {TIME_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  timeRange === r.id
                    ? "bg-white/15 text-white"
                    : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                }`}
                title={r.description}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(timeRange)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Actualizar"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Usuarios",
            value: overview.summary?.totalUsers.toLocaleString() || "0",
            icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
            color: "text-blue-400",
          },
          {
            label: "Sesiones",
            value: overview.summary?.totalSessions.toLocaleString() || "0",
            icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
            color: "text-violet-400",
          },
          {
            label: "Paginas vistas",
            value: overview.summary?.totalPageViews.toLocaleString() || "0",
            icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
            color: "text-amber-400",
          },
          {
            label: "Duracion prom.",
            value: formatDuration(overview.summary?.avgSessionDuration || 0),
            icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-emerald-400",
          },
          {
            label: "Bounce rate",
            value: `${(overview.summary?.avgBounceRate ?? 0).toFixed(1)}%`,
            icon: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3",
            color: "text-rose-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="liquid-surface group p-4 transition-all hover:border-white/10">
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ${stat.color}`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-slate-500">{stat.label}</span>
            </div>
            <p className="text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-600">{rangeLabel}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="liquid-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Tendencia ({rangeLabel})</h3>
          <div className="flex overflow-hidden rounded-md border border-white/[0.06]">
            {(["users", "sessions", "pageViews"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-2.5 py-1 text-[10px] font-medium transition-all ${
                  chartMetric === m
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "users" ? "Usuarios" : m === "sessions" ? "Sesiones" : "Paginas"}
              </button>
            ))}
          </div>
        </div>
        {days.length > 1 ? (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full"
              style={{ height: 200 }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                  <stop offset="100%" stopColor="rgba(99,102,241,0.01)" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((pct) => {
                const y = padY + pct * (chartH - padY * 2);
                return (
                  <line
                    key={pct}
                    x1={padX}
                    y1={y}
                    x2={chartW - padX}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* Y-axis labels */}
              {[0, 0.5, 1].map((pct) => {
                const y = padY + (1 - pct) * (chartH - padY * 2);
                const val = Math.round(maxVal * pct);
                return (
                  <text
                    key={pct}
                    x={padX - 4}
                    y={y + 3}
                    textAnchor="end"
                    fill="rgba(148,163,184,0.4)"
                    fontSize="9"
                    fontFamily="system-ui"
                    vectorEffect="non-scaling-stroke"
                  >
                    {val}
                  </text>
                );
              })}
              {/* Area */}
              <path d={areaPath} fill="url(#chartGradient)" />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="rgb(99,102,241)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Dots */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={points.length > 20 ? 2 : 3.5}
                    fill="rgb(99,102,241)"
                    stroke="rgba(15,15,30,0.8)"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <title>
                    {p.date?.slice(6, 8)}/{p.date?.slice(4, 6)}: {p[chartMetric]}
                  </title>
                </g>
              ))}
            </svg>
            {/* X-axis labels */}
            <div className="mt-1 flex justify-between px-8">
              {(() => {
                const step =
                  points.length <= 7 ? 1 : points.length <= 14 ? 2 : Math.ceil(points.length / 8);
                return points
                  .filter((_, i) => i % step === 0 || i === points.length - 1)
                  .map((p, i) => (
                    <span key={i} className="text-[10px] tabular-nums text-slate-600">
                      {p.date?.slice(6, 8)}/{p.date?.slice(4, 6)}
                    </span>
                  ));
              })()}
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-600">
            No hay datos suficientes para el rango seleccionado
          </div>
        )}
      </div>

      {/* Map + Pages side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* World Map */}
        <div className="liquid-surface p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Mapa de visitantes
          </h3>
          <div
            className="relative overflow-hidden rounded-lg border border-white/[0.04]"
            style={{ height: 300, background: "rgba(10,12,20,0.6)" }}
          >
            <ComposableMap
              projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }}
              width={800}
              height={400}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                zoom={mapZoom}
                center={mapCenter}
                onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
                  setMapCenter(coordinates);
                  setMapZoom(zoom);
                }}
                minZoom={1}
                maxZoom={8}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties?: { ISO_A3?: string } }> }) =>
                    geographies.map((geo) => {
                      const id = geo.id;
                      const iso3 = geo.properties?.ISO_A3 || NUMERIC_TO_ISO3[id] || "";
                      const users = countryUserMap[iso3] || 0;
                      const intensity = users > 0 ? Math.max(0.3, users / maxCountryUsers) : 0;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => setHoveredGeo(iso3)}
                          onMouseLeave={() => setHoveredGeo(null)}
                          style={{
                            default: {
                              fill: users > 0
                                ? `rgba(99,102,241,${intensity * 0.8})`
                                : "rgba(30,32,50,0.6)",
                              stroke: "rgba(55,60,80,0.5)",
                              strokeWidth: 0.5,
                              outline: "none",
                            },
                            hover: {
                              fill: users > 0 ? "rgb(99,102,241)" : "rgba(50,52,70,0.8)",
                              stroke: "rgba(100,105,130,0.6)",
                              strokeWidth: 0.8,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {locations.locations.map((loc, i) => {
                  const coords = CITY_COORDS[loc.city];
                  if (!coords) return null;
                  const r = Math.max(3, Math.min(8, (loc.users / maxCountryUsers) * 10));
                  return (
                    <Marker key={i} coordinates={coords}>
                      <circle r={r} fill="rgb(99,102,241)" fillOpacity={0.9} stroke="white" strokeWidth={0.8} />
                      <title>{`${loc.city}, ${loc.country}: ${loc.users} usuarios`}</title>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            {/* Zoom controls */}
            <div className="absolute bottom-2 left-2 flex flex-col gap-1">
              <button
                onClick={() => setMapZoom((z) => Math.min(z * 1.5, 8))}
                className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-black/60 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                +
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z / 1.5, 1))}
                className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-black/60 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                −
              </button>
              {mapZoom > 1 && (
                <button
                  onClick={() => {
                    setMapZoom(1);
                    setMapCenter([0, 20]);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-black/60 text-[10px] text-slate-300 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  ⟲
                </button>
              )}
            </div>

            {/* Hover tooltip */}
            {hoveredGeo && countryUserMap[hoveredGeo] && (
              <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {Object.entries(COUNTRY_TO_ISO3).find(([, v]) => v === hoveredGeo)?.[0]}:{" "}
                <span className="text-indigo-300">{countryUserMap[hoveredGeo]} usuarios</span>
              </div>
            )}
          </div>

          {/* Location chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {locations.locations.slice(0, 10).map((loc, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400"
              >
                {loc.city}
                <span className="font-semibold text-indigo-400">{loc.users}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right column: top pages + devices */}
        <div className="space-y-4">
          {/* Top Pages */}
          <div className="liquid-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Top paginas
            </h3>
            <div className="space-y-1.5">
              {topPages.pages.slice(0, 8).map((page, i) => {
                const maxViews = topPages.pages[0]?.views || 1;
                const barWidth = (page.views / maxViews) * 100;
                return (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                    {/* Bar background */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/[0.08] transition-all group-hover:bg-indigo-500/[0.12]"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="relative flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{page.title}</p>
                        <p className="truncate text-[10px] text-slate-600">{page.path}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-indigo-400">{page.views}</p>
                        <p className="text-[10px] text-slate-600">{formatDuration(page.avgDuration)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device breakdown */}
          <div className="liquid-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Dispositivos
            </h3>
            <div className="space-y-3">
              {deviceStats.map((d, i) => {
                const barW = totalDeviceUsers > 0 ? (d.users / totalDeviceUsers) * 100 : 0;
                const colors = [
                  { bar: "bg-blue-500/30", text: "text-blue-400" },
                  { bar: "bg-violet-500/30", text: "text-violet-400" },
                  { bar: "bg-emerald-500/30", text: "text-emerald-400" },
                ];
                const color = colors[i % colors.length];
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs capitalize text-slate-300">{d.device}</span>
                      <span className={`text-xs font-semibold ${color.text}`}>
                        {d.users} ({d.pct}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${color.bar} transition-all duration-700`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
