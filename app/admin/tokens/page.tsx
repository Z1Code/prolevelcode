import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminTokensPage() {
  const [tokens, lessonStats, userStats, recentActivity] = await Promise.all([
    // All tokens for the table
    prisma.videoToken.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        token: true,
        current_views: true,
        max_views: true,
        expires_at: true,
        is_revoked: true,
        last_used_at: true,
        created_at: true,
        user: { select: { email: true, full_name: true } },
        lesson: { select: { title: true } },
        course: { select: { title: true } },
      },
    }),

    // Most watched lessons (aggregate views per lesson)
    prisma.videoToken.groupBy({
      by: ["lesson_id"],
      _sum: { current_views: true },
      _count: { id: true },
      orderBy: { _sum: { current_views: "desc" } },
      take: 10,
    }),

    // Top viewers (aggregate views per user)
    prisma.videoToken.groupBy({
      by: ["user_id"],
      _sum: { current_views: true },
      _count: { id: true },
      orderBy: { _sum: { current_views: "desc" } },
      take: 8,
    }),

    // Recently active tokens (used in last 24h)
    prisma.videoToken.findMany({
      where: {
        last_used_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        is_revoked: false,
      },
      orderBy: { last_used_at: "desc" },
      take: 10,
      select: {
        id: true,
        current_views: true,
        last_used_at: true,
        user: { select: { email: true, full_name: true } },
        lesson: { select: { title: true } },
        course: { select: { title: true } },
      },
    }),
  ]);

  // Hydrate lesson stats with lesson titles
  const lessonIds = lessonStats.map((s) => s.lesson_id);
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true, course: { select: { title: true } } },
  });
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  // Hydrate user stats with user info
  const userIds = userStats.map((s) => s.user_id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, full_name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Computed metrics
  const totalTokens = tokens.length;
  const activeTokens = tokens.filter((t) => !t.is_revoked && t.expires_at > new Date()).length;
  const totalViews = tokens.reduce((sum, t) => sum + t.current_views, 0);
  const uniqueViewers = new Set(tokens.map((t) => t.user.email)).size;
  const maxLessonViews = lessonStats[0]?._sum.current_views ?? 1;
  const maxUserViews = userStats[0]?._sum.current_views ?? 1;

  return (
    <div className="page-enter space-y-6">
      <h2 className="text-2xl font-semibold">Monitor de tokens</h2>

      {/* ── Summary stats ── */}
      <div className="stagger-enter grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift p-4">
          <p className="text-xs text-slate-400">Total tokens</p>
          <p className="mt-1 text-2xl font-semibold">{totalTokens}</p>
        </Card>
        <Card className="hover-lift p-4">
          <p className="text-xs text-slate-400">Tokens activos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">{activeTokens}</p>
        </Card>
        <Card className="hover-lift p-4">
          <p className="text-xs text-slate-400">Reproducciones totales</p>
          <p className="mt-1 text-2xl font-semibold text-violet-300">{totalViews}</p>
        </Card>
        <Card className="hover-lift p-4">
          <p className="text-xs text-slate-400">Espectadores unicos</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{uniqueViewers}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Most watched lessons — animated bars ── */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-violet-400">
              <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 00-1.14.642v4.532a.75.75 0 001.14.642l3.72-2.267a.75.75 0 000-1.283l-3.72-2.266z" />
            </svg>
            Videos mas vistos
          </h3>
          {lessonStats.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin datos de reproduccion aun.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {lessonStats.map((stat, i) => {
                const lesson = lessonMap.get(stat.lesson_id);
                const views = stat._sum.current_views ?? 0;
                const pct = Math.max(4, (views / maxLessonViews) * 100);
                return (
                  <div key={stat.lesson_id} className="group">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-200 transition-colors group-hover:text-white">
                          {lesson?.title ?? "Leccion eliminada"}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {lesson?.course.title ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-violet-300">{views}</span>
                        <span className="text-[10px] text-slate-600">
                          {stat._count.id} token{stat._count.id !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="bar-grow h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, rgba(139,92,246,0.7), rgba(167,139,250,0.9))`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Top viewers ── */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            Usuarios mas activos
          </h3>
          {userStats.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin datos de usuarios aun.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {userStats.map((stat, i) => {
                const user = userMap.get(stat.user_id);
                const views = stat._sum.current_views ?? 0;
                const pct = Math.max(4, (views / maxUserViews) * 100);
                return (
                  <div key={stat.user_id} className="group">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === 0 ? "bg-amber-500/20 text-amber-300" :
                          i === 1 ? "bg-slate-300/15 text-slate-300" :
                          i === 2 ? "bg-orange-500/15 text-orange-400" :
                          "bg-white/5 text-slate-500"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-200 transition-colors group-hover:text-white">
                            {user?.full_name || user?.email?.split("@")[0] || "—"}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">{user?.email ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-amber-300">{views}</span>
                        <span className="text-[10px] text-slate-600">
                          {stat._count.id} video{stat._count.id !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="bar-grow h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, rgba(245,158,11,0.6), rgba(251,191,36,0.9))`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Live activity feed (last 24h) ── */}
      {recentActivity.length > 0 && (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Actividad reciente (24h)
          </h3>
          <div className="mt-3 stagger-enter space-y-2">
            {recentActivity.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-300">
                  {(t.user.full_name?.[0] || t.user.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">
                    <span className="font-medium">{t.user.full_name || t.user.email.split("@")[0]}</span>
                    <span className="text-slate-500"> vio </span>
                    <span className="text-violet-300">{t.lesson.title}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {t.course.title} · {t.current_views} vista{t.current_views !== 1 ? "s" : ""}
                    {t.last_used_at && (
                      <> · {timeAgo(t.last_used_at)}</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Full token table ── */}
      <Card className="overflow-hidden p-0">
        <details>
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-400 transition hover:text-white">
            Tabla completa de tokens ({tokens.length})
          </summary>
          <div className="overflow-x-auto">
            <table className="liquid-table w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Leccion</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Vistas</th>
                  <th className="px-4 py-3">Ultimo uso</th>
                  <th className="px-4 py-3">Expira</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => {
                  const isActive = !token.is_revoked && token.expires_at > new Date();
                  const isRecent = token.last_used_at && (Date.now() - token.last_used_at.getTime()) < 3600000;
                  return (
                    <tr key={token.id}>
                      <td className="px-4 py-3 font-mono text-slate-500">{token.token.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        {token.user.email}
                        {token.user.full_name && (
                          <p className="text-[10px] text-slate-500">{token.user.full_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">{token.lesson.title}</td>
                      <td className="px-4 py-3 text-slate-500">{token.course.title}</td>
                      <td className="px-4 py-3">
                        <span className={token.current_views >= token.max_views ? "text-red-300" : "text-slate-200"}>
                          {token.current_views}/{token.max_views}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {token.last_used_at ? (
                          <span className={isRecent ? "text-emerald-300" : ""}>
                            {timeAgo(token.last_used_at)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {token.expires_at.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : token.is_revoked
                              ? "bg-red-500/15 text-red-300"
                              : "bg-slate-500/15 text-slate-400"
                        }`}>
                          {token.is_revoked ? "Revocado" : isActive ? "Activo" : "Expirado"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </Card>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
