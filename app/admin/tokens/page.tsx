import { Card } from "@/components/ui/card";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface TokenRow {
  id: string;
  token: string;
  current_views: number;
  max_views: number;
  expires_at: string;
  is_revoked: boolean;
  users: Array<{ email: string | null }>;
}

export default async function AdminTokensPage() {
  const supabase = createAdminSupabaseClient();
  const { data: tokens } = await supabase
    .from("video_tokens")
    .select("id,token,user_id,course_id,lesson_id,current_views,max_views,expires_at,is_revoked,users(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = ((tokens ?? []) as unknown) as TokenRow[];

  return (
    <div>
      <h2 className="text-2xl font-semibold">Monitor de tokens</h2>
      <Card className="mt-4 overflow-x-auto p-0">
        <table className="liquid-table w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Vistas</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((token) => (
              <tr key={token.id}>
                <td className="px-4 py-3">{token.token.slice(0, 8)}...</td>
                <td className="px-4 py-3">{token.users?.[0]?.email}</td>
                <td className="px-4 py-3">
                  {token.current_views}/{token.max_views}
                </td>
                <td className="px-4 py-3">{new Date(token.expires_at).toLocaleString("es-ES")}</td>
                <td className="px-4 py-3">{token.is_revoked ? "Revocado" : "Activo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
