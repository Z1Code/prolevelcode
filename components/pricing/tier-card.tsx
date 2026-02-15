"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TierCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isCurrentPlan?: boolean;
  highlighted?: boolean;
  onCheckoutMp?: string; // form action URL for MercadoPago
  onCheckoutCrypto?: string; // API route for crypto checkout
  onCheckoutPaypal?: string; // URL base for PayPal payment page
  tier: "basic" | "pro";
  isLoggedIn: boolean;
}

export function TierCard({
  name,
  price,
  description,
  features,
  isCurrentPlan,
  highlighted,
  onCheckoutMp,
  onCheckoutCrypto,
  onCheckoutPaypal,
  tier,
  isLoggedIn,
}: TierCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"mp" | "crypto" | "paypal" | null>(null);

  async function handleCryptoCheckout() {
    if (!onCheckoutCrypto || loading) return;
    setLoading("crypto");
    try {
      const res = await fetch(onCheckoutCrypto, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear orden");
      }

      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear orden crypto");
      setLoading(null);
    }
  }

  function handlePaypalClick(e: React.MouseEvent) {
    if (loading) {
      e.preventDefault();
      return;
    }
    setLoading("paypal");
  }

  const isDisabled = loading !== null;

  return (
    <Card className={`p-6 ${highlighted ? "ring-2 ring-violet-500/40" : ""}`}>
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-bold">{name}</h3>
        {isCurrentPlan && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            Plan actual
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <p className="mt-4 text-4xl font-bold">
        {price}
        <span className="text-base font-normal text-slate-400"> USD (unico pago)</span>
      </p>

      <ul className="mt-6 space-y-2 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-400">&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrentPlan && isLoggedIn && (
        <div className="mt-6 flex flex-col gap-2">
          {onCheckoutMp && (
            <form
              action={onCheckoutMp}
              method="post"
              onSubmit={() => setLoading("mp")}
            >
              <input type="hidden" name="tier" value={tier} />
              <Button type="submit" className="pay-btn w-full" disabled={isDisabled}>
                <span className="pay-btn-shimmer" />
                {loading === "mp" ? "Redirigiendo..." : "Pagar con MercadoPago"}
              </Button>
            </form>
          )}
          {onCheckoutCrypto && (
            <button
              onClick={handleCryptoCheckout}
              disabled={isDisabled}
              className="pay-btn pay-btn-crypto"
            >
              <span className="pay-btn-shimmer" />
              {loading === "crypto" ? "Creando orden..." : "Pagar con Crypto (USDT)"}
            </button>
          )}
          {onCheckoutPaypal && (
            <a
              href={`${onCheckoutPaypal}?tier=${tier}`}
              onClick={handlePaypalClick}
              className={isDisabled ? "pointer-events-none" : ""}
            >
              <button
                disabled={isDisabled}
                className="pay-btn pay-btn-paypal w-full"
              >
                <span className="pay-btn-shimmer" />
                {loading === "paypal" ? "Redirigiendo..." : "Pagar con PayPal"}
              </button>
            </a>
          )}
        </div>
      )}

      {!isCurrentPlan && !isLoggedIn && (
        <div className="mt-6">
          <a href={`/login?next=${encodeURIComponent("/planes")}`}>
            <Button className="w-full">Inicia sesion para comprar</Button>
          </a>
        </div>
      )}
    </Card>
  );
}
