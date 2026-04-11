import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminContactPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, company: true, message: true, is_read: true, created_at: true },
  });

  return (
    <div className="page-enter">
      <h2 className="text-2xl font-semibold">Mensajes de contacto</h2>
      <div className="mt-4 stagger-enter space-y-3">
        {messages.map((message) => (
          <Card key={message.id} className="p-4 hover-lift">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">
                {message.name} - {message.email}
              </p>
              <span className="text-xs text-slate-400">
                {message.created_at.toLocaleString("es-ES")}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{message.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
