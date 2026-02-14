import { env } from "@/lib/env";

export function getBaseUrl() {
  return env.appUrl;
}

export function currencyFormatter(amountInCents: number, currency = "USD") {
  if (currency === "USDT") {
    return `${(amountInCents / 100).toFixed(2)} USDT`;
  }
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}
