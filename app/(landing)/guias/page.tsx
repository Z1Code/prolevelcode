import { GuideCatalog } from "@/components/guides/guide-catalog";
import { GuidesCountdown } from "@/components/guides/guides-countdown";
import { getSessionUser } from "@/lib/auth/session";
import { getUserTier } from "@/lib/access/check-access";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { TierLevel } from "@/lib/guides/types";

export const metadata = {
  title: "Guias — ProLevelCode",
  description: "Aprende paso a paso a configurar tu entorno, crear proyectos con Claude Code y desplegar en Vercel.",
};

export default async function GuiasPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/guias");
  }

  const rawTier = await getUserTier(sessionUser.id);
  const userTier: TierLevel | null = rawTier ?? "free";

  return (
    <main className="container-wide section-spacing liquid-section">
      <GuidesCountdown>
        <div className="mb-12">
          <h1 className="text-4xl font-bold md:text-5xl">
            Guias
          </h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Aprende paso a paso — desde instalar tu primer programa hasta desplegar
            proyectos completos en produccion.
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400">
              16 guias
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">De cero a produccion</span>
          </div>
        </div>

        <GuideCatalog userTier={userTier} />

        <div className="mt-16 rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-bold text-white">Quieres ir mas rapido?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Accede a cursos en video con proyectos guiados, soporte directo y certificado.
          </p>
          <Link
            href="/cursos"
            className="mt-4 inline-flex h-10 items-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver cursos
          </Link>
        </div>
      </GuidesCountdown>
    </main>
  );
}
