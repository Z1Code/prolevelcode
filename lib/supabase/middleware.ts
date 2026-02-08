import { NextResponse, type NextRequest } from "next/server";
import { FirebaseSupabaseCompatClient } from "@/lib/firebase/supabase-compat";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = new FirebaseSupabaseCompatClient({
    cookieStore: {
      get(name: string) {
        const found = request.cookies.get(name);
        if (!found) return undefined;
        return { value: found.value };
      },
    },
  });

  await supabase.auth.getUser();
  return { supabase, response };
}
