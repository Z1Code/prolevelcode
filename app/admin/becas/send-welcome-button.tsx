"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendScholarshipWelcomeEmails } from "../actions";

export function SendWelcomeButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Enviar correo de bienvenida a todos los becados activos?")) return;

    startTransition(async () => {
      const sent = await sendScholarshipWelcomeEmails();
      setResult(`${sent} correo${sent !== 1 ? "s" : ""} enviado${sent !== 1 ? "s" : ""}`);
      setTimeout(() => setResult(null), 5000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleClick} disabled={isPending} size="sm" variant="ghost">
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
              <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
            </svg>
            Enviar correo de bienvenida
          </span>
        )}
      </Button>
      {result && (
        <span className="alert-enter rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
          {result}
        </span>
      )}
    </div>
  );
}
