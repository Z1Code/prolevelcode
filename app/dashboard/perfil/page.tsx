import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function DashboardProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("full_name,email,avatar_url").eq("id", user?.id ?? "").maybeSingle();

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


