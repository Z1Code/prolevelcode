import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

export default async function AdminContactPage() {
  const supabase = createAdminSupabaseClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id,name,email,company,message,is_read,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Mensajes de contacto</h2>
      <div className="mt-4 space-y-3">
        {messages?.map((message) => (
          <Card key={message.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">
                {message.name} - {message.email}
              </p>
              <span className="text-xs text-slate-400">
                {new Date(message.created_at).toLocaleString("es-ES")}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{message.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
