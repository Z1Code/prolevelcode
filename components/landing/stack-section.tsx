import { Card } from "@/components/ui/card";

const tools = [
  "Next.js", "React", "TypeScript", "Tailwind", "PostgreSQL", "MercadoPago", "OpenAI", "Google Cloud", "Neon", "Prisma", "Docker", "AWS",
];

export function StackSection() {
  return (
    <section className="section-spacing liquid-section">
      <div className="container-wide">
        <h2 className="text-3xl font-bold md:text-5xl">Stack de tecnologia real para produccion</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tools.map((tool) => (
            <Card key={tool} className="flex h-20 items-center justify-center text-sm font-medium text-slate-200 transition hover:-translate-y-1 hover:border-blue-300/40">
              {tool}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
