"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaymentMethodSelectorProps {
  courseId: string;
  mpAction: string;
  cryptoAction: string;
}

export function PaymentMethodSelector({ courseId, mpAction, cryptoAction }: PaymentMethodSelectorProps) {
  const router = useRouter();
  const [method, setMethod] = useState<"mp" | "crypto">("mp");
  const [loading, setLoading] = useState(false);

  async function handleCryptoCheckout() {
    setLoading(true);
    try {
      const res = await fetch(cryptoAction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear orden");
      }

      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear orden crypto");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMethod("mp")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            method === "mp"
              ? "bg-white/15 text-white"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          MercadoPago
        </button>
        <button
          onClick={() => setMethod("crypto")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            method === "crypto"
              ? "bg-white/15 text-white"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          Crypto (USDT)
        </button>
      </div>

      {method === "mp" ? (
        <form action={mpAction} method="post">
          <input type="hidden" name="courseId" value={courseId} />
          <Button type="submit">Comprar con MercadoPago</Button>
        </form>
      ) : (
        <Button onClick={handleCryptoCheckout} disabled={loading}>
          {loading ? "Creando orden..." : "Pagar con Crypto (USDT)"}
        </Button>
      )}
    </div>
  );
}
