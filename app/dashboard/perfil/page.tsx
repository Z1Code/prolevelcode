import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile } from "../actions";

interface ProfilePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const user = await getSessionUser();

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { full_name: true, email: true, avatar_url: true },
      })
    : null;

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Perfil</h2>
      {message && <p className="mt-2 alert-enter text-sm text-emerald-300">{message}</p>}
      <form action={updateProfile} className="mt-4 grid gap-3 max-w-lg">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Nombre completo</span>
          <Input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Nombre completo" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Email</span>
          <Input defaultValue={profile?.email ?? user?.email ?? ""} disabled />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Avatar URL</span>
          <Input name="avatar_url" defaultValue={profile?.avatar_url ?? ""} placeholder="https://..." />
        </label>
        <Button type="submit">Guardar cambios</Button>
      </form>
    </div>
  );
}
