"use client";

import { useState } from "react";
import { deleteUser } from "../actions";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Eliminar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-red-300">Eliminar {userEmail}?</span>
      <form action={deleteUser}>
        <input type="hidden" name="id" value={userId} />
        <Button type="submit" variant="danger" size="sm">
          Confirmar
        </Button>
      </form>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  );
}
