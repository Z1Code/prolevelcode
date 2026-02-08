"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(getFirebaseClientAuth(), oobCode, password);
      router.replace("/login?message=" + encodeURIComponent("Contraseña actualizada. Inicia sesion."));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <Input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Repite la contraseña"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
