"use client";

import { Button } from "@/components/ui/button";

export function GoogleLoginButton({ next = "/dashboard" }: { next?: string }) {
  function handleClick() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state: next,
      prompt: "select_account",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  return (
    <Button type="button" variant="ghost" className="w-full" onClick={handleClick}>
      Continuar con Google
    </Button>
  );
}
