"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  return (
    <form action="/api/auth/reset-password" method="POST" className="mt-6 space-y-3">
      <input type="hidden" name="token" value={token} />
      <Input
        name="password"
        type="password"
        placeholder="Nueva contraseña (min. 8 caracteres)"
        required
        minLength={8}
      />
      <Input
        name="confirm"
        type="password"
        placeholder="Repite la contraseña"
        required
        minLength={8}
      />
      <Button type="submit" className="w-full">
        Actualizar contraseña
      </Button>
    </form>
  );
}
