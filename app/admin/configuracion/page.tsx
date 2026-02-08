import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { coerceBooleanConfig } from "@/lib/utils/site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SiteConfigRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export default async function AdminConfigPage() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("site_config").select("key,value,updated_at").order("key", { ascending: true });
  const settings = (data ?? []) as SiteConfigRow[];

  const showServicesSetting = settings.find((item) => item.key === "show_services");
  const showServices = coerceBooleanConfig(showServicesSetting?.value, true);

  async function saveFeatures(formData: FormData) {
    "use server";
    const showServicesEnabled = formData.get("show_services") === "on";
    const adminSupabase = createAdminSupabaseClient();
    await adminSupabase
      .from("site_config")
      .upsert({ key: "show_services", value: showServicesEnabled }, { onConflict: "key" });

    revalidatePath("/");
    revalidatePath("/admin/configuracion");
    revalidatePath("/servicios");
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Configuracion</h2>

      <Card className="mt-4 p-4">
        <form action={saveFeatures} className="liquid-surface-soft flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-slate-100">Visibilidad de servicios</p>
            <p className="mt-1 text-xs text-slate-400">
              Oculta el panel de servicios, el boton Contratar y el CTA Ver Servicios del hero.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              name="show_services"
              defaultChecked={showServices}
              className="h-4 w-4 accent-emerald-400"
            />
            Mostrar servicios
          </label>

          <Button type="submit" size="sm">
            Guardar
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-4">
        <ul className="space-y-2 text-sm">
          {settings.map((item) => (
            <li key={item.key} className="liquid-surface-soft p-3">
              <p className="font-medium">{item.key}</p>
              <p className="mt-1 text-xs text-slate-400">{JSON.stringify(item.value)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
