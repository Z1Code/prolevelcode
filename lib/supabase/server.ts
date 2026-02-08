import { cookies } from "next/headers";
import { FirebaseSupabaseCompatClient } from "@/lib/firebase/supabase-compat";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return new FirebaseSupabaseCompatClient({ cookieStore });
}
