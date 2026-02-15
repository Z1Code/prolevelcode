"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TIER_INFO = {
  basic: { name: "Basic", price: "$29", amountDisplay: "29.00 USD" },
  pro: { name: "Pro", price: "$99", amountDisplay: "99.00 USD" },
} as const;

const PAYPAL_EMAIL = "jtopicshow@gmail.com";
const PAYMENT_CONCEPT = "pago de curso web prolevelcode";

export default function PaypalPayPage() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");
  const tier = tierParam === "pro" ? "pro" : "basic";
  const info = TIER_INFO[tier];

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Sube una captura del pago.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("tier", tier);
      formData.append("screenshot", file);

      const res = await fetch("/api/checkout/paypal/tier", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar el pago");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="container-wide section-spacing liquid-section">
        <div className="mx-auto max-w-lg">
          <Card className="p-8 text-center">
            <div className="text-4xl">&#10003;</div>
            <h2 className="mt-4 text-2xl font-bold">Pago enviado</h2>
            <p className="mt-2 text-slate-300">
              Tu comprobante fue recibido. Validaremos tu pago en un plazo de{" "}
              <span className="font-semibold text-amber-300">2 a 12 horas</span>.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Recibiras un email de confirmacion cuando tu plan{" "}
              <span className="font-semibold text-white">{info.name}</span> sea activado.
            </p>
            <a href="/planes" className="mt-6 inline-block text-sm text-violet-400 hover:text-violet-300 transition">
              Volver a planes
            </a>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="container-wide section-spacing liquid-section">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold">Pagar con PayPal</h1>
        <p className="mt-2 text-slate-400">
          Plan <span className="font-semibold text-white">{info.name}</span> — {info.price} USD
        </p>

        <Card className="mt-6 space-y-5 p-6">
          {/* PayPal instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">1. Envia el pago a este PayPal:</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="font-mono text-sm text-emerald-300 select-all">{PAYPAL_EMAIL}</p>
            </div>

            <h3 className="text-sm font-semibold text-slate-300">2. Monto exacto:</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="font-mono text-lg font-bold text-white">{info.amountDisplay}</p>
            </div>

            <h3 className="text-sm font-semibold text-slate-300">3. Concepto del pago:</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-sm text-slate-200 select-all">{PAYMENT_CONCEPT}</p>
            </div>
          </div>

          <hr className="border-slate-700" />

          {/* Screenshot upload */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-300">
                4. Sube la captura del comprobante:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError("");
                }}
                className="mt-2 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-300 file:cursor-pointer hover:file:bg-violet-500/25"
              />
              {file && (
                <p className="mt-1 text-xs text-slate-500">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-xs text-amber-300">
                Validacion entre 2 a 12 horas. Recibiras un email cuando tu plan sea activado.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? "Enviando..." : "Enviar comprobante"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
