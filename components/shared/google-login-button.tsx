"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleLoginButton({ next = "/dashboard" }: { next?: string }) {
  async function handleClick() {
    const supabase = createClient();
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (!result.error) {
      window.location.href = next;
    }
  }

  return (
    <Button type="button" variant="ghost" className="w-full" onClick={handleClick}>
      Continuar con Google
    </Button>
  );
}


