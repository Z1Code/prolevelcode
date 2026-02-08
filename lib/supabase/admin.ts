import { FirebaseSupabaseCompatClient } from "@/lib/firebase/supabase-compat";

export function createAdminSupabaseClient() {
  return new FirebaseSupabaseCompatClient();
}
