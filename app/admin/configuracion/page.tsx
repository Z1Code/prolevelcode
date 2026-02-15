import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { coerceBooleanConfig } from "@/lib/utils/site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sectionToggles = [
  {
    key: "show_services",
    label: "Servicios",
    description: "Muestra la seccion de servicios, el boton Contratar y el CTA Ver Servicios del hero.",
  },
  {
    key: "show_courses",
    label: "Cursos",
    description: "Muestra la seccion de cursos destacados en el landing.",
  },
  {
    key: "show_process",
    label: "Proceso",
    description: "Muestra la seccion de proceso de trabajo.",
  },
  {
    key: "show_testimonials",
    label: "Testimonios",
    description: "Muestra la seccion de testimonios de clientes.",
  },
  {
    key: "show_stack",
    label: "Stack",
    description: "Muestra la seccion de tecnologias / stack.",
  },
  {
    key: "show_final_cta",
    label: "CTA Final",
    description: "Muestra la seccion de llamada a la accion final.",
  },
] as const;

export default async function AdminConfigPage() {
  const settings = await prisma.siteConfig.findMany({
    orderBy: { key: "asc" },
  });

  const getValue = (key: string) => {
    const row = settings.find((item) => item.key === key);
    return coerceBooleanConfig(row?.value, false);
  };

  async function saveFeatures(formData: FormData) {
    "use server";

    const upserts = sectionToggles.map((toggle) => {
      const enabled = formData.get(toggle.key) === "on";
      return prisma.siteConfig.upsert({
        where: { key: toggle.key },
        update: { value: enabled, updated_at: new Date() },
        create: { key: toggle.key, value: enabled },
      });
    });

    await Promise.all(upserts);

    revalidatePath("/");
    revalidatePath("/admin/configuracion");
  }

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Configuracion</h2>

      <Card className="mt-4 p-4">
        <form action={saveFeatures} className="flex flex-col gap-3">
          <p className="mb-1 text-sm font-medium text-slate-300">
            Secciones visibles en el landing
          </p>

          {sectionToggles.map((toggle, i) => (
            <label
              key={toggle.key}
              className="liquid-surface-soft flex items-center justify-between gap-4 rounded-lg p-4 hover-lift"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div>
                <p className="font-medium text-slate-100">{toggle.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{toggle.description}</p>
              </div>
              <input
                type="checkbox"
                name={toggle.key}
                defaultChecked={getValue(toggle.key)}
                className="h-4 w-4 flex-shrink-0 accent-emerald-400"
              />
            </label>
          ))}

          <Button type="submit" size="sm" className="mt-2 self-end">
            Guardar
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-4">
        <p className="mb-2 text-sm font-medium text-slate-300">Todas las configuraciones</p>
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
