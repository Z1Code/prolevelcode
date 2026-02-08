import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function DashboardProfilePage() {
  const user = await getSessionUser();

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { full_name: true, email: true, avatar_url: true },
      })
    : null;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Perfil</h2>
      <form className="mt-4 grid gap-3 max-w-lg">
        <Input defaultValue={profile?.full_name ?? ""} placeholder="Nombre completo" />
        <Input defaultValue={profile?.email ?? user?.email ?? ""} disabled />
        <Input defaultValue={profile?.avatar_url ?? ""} placeholder="Avatar URL" />
        <Button type="button">Guardar cambios</Button>
      </form>
    </div>
  );
}
