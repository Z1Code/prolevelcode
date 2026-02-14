import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "./tier-badge";

interface TimelineCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  total_lessons: number | null;
  total_duration_minutes: number | null;
  tier_access: string;
  is_coming_soon: boolean;
}

interface CourseTimelineProps {
  basicCourses: TimelineCourse[];
  proCourses: TimelineCourse[];
  userTier: "pro" | "basic" | null;
  enrolledCourseIds: Set<string>;
  thumbnailMap: Map<string, string>;
}

function isUnlocked(
  course: TimelineCourse,
  userTier: "pro" | "basic" | null,
  enrolledCourseIds: Set<string>,
): boolean {
  if (enrolledCourseIds.has(course.id)) return true;
  if (course.is_coming_soon) return false;
  if (course.tier_access === "basic") return userTier === "basic" || userTier === "pro";
  if (course.tier_access === "pro") return userTier === "pro";
  return false;
}

function TimelineCard({
  course,
  unlocked,
  thumbnailUrl,
  isLast,
}: {
  course: TimelineCourse;
  unlocked: boolean;
  thumbnailUrl: string | null;
  isLast: boolean;
}) {
  const content = (
    <div
      className={`group relative grid gap-4 rounded-xl border p-4 transition md:grid-cols-[180px_1fr] ${
        unlocked
          ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
          : "pointer-events-none border-white/5 bg-white/[0.01] opacity-40"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-500/40 via-slate-950 to-violet-500/25" />
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Lock className="h-6 w-6 text-white/60" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{course.title}</h3>
          <TierBadge tier={course.tier_access} isComingSoon={course.is_coming_soon} />
        </div>
        <p className="mt-1 text-sm text-slate-400">{course.subtitle ?? course.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          {course.total_lessons ?? 0} lecciones{" "}
          {course.total_duration_minutes ? `· ${course.total_duration_minutes} min` : ""}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative flex gap-4 pl-6 md:pl-8">
      {/* Timeline line + dot */}
      <div className="absolute left-0 top-0 flex h-full w-6 flex-col items-center md:w-8">
        <div
          className={`h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 ${
            unlocked
              ? course.tier_access === "pro"
                ? "border-violet-400 bg-violet-400/30"
                : "border-emerald-400 bg-emerald-400/30"
              : "border-slate-600 bg-slate-800"
          }`}
        />
        {!isLast && <div className="w-px flex-1 bg-white/10" />}
      </div>

      <div className="flex-1 pb-6">
        {unlocked ? (
          <Link href={`/cursos/${course.slug}`}>{content}</Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

export function CourseTimeline({
  basicCourses,
  proCourses,
  userTier,
  enrolledCourseIds,
  thumbnailMap,
}: CourseTimelineProps) {
  const allBasic = basicCourses.map((c) => ({
    course: c,
    unlocked: isUnlocked(c, userTier, enrolledCourseIds),
    thumb: c.thumbnail_url || thumbnailMap.get(c.id) || null,
  }));
  const allPro = proCourses.map((c) => ({
    course: c,
    unlocked: isUnlocked(c, userTier, enrolledCourseIds),
    thumb: c.thumbnail_url || thumbnailMap.get(c.id) || null,
  }));

  return (
    <div className="mt-8 space-y-10">
      {/* No-tier banner */}
      {!userTier && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
          <p className="text-sm text-slate-300">
            Elige un plan para desbloquear los cursos
          </p>
          <Link href="/planes">
            <Button size="sm" className="mt-3">
              Ver planes
            </Button>
          </Link>
        </div>
      )}

      {/* Basic section */}
      {allBasic.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Basic · $29
            </span>
            <div className="h-px flex-1 bg-emerald-500/15" />
          </div>
          <div>
            {allBasic.map(({ course, unlocked, thumb }, i) => (
              <TimelineCard
                key={course.id}
                course={course}
                unlocked={unlocked}
                thumbnailUrl={thumb}
                isLast={i === allBasic.length - 1 && allPro.length === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pro section */}
      {allPro.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
              Pro · $99
            </span>
            <div className="h-px flex-1 bg-violet-500/15" />
          </div>
          <div>
            {allPro.map(({ course, unlocked, thumb }, i) => (
              <TimelineCard
                key={course.id}
                course={course}
                unlocked={unlocked}
                thumbnailUrl={thumb}
                isLast={i === allPro.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {allBasic.length === 0 && allPro.length === 0 && (
        <p className="text-center text-sm text-slate-500">No hay cursos disponibles aun.</p>
      )}
    </div>
  );
}
