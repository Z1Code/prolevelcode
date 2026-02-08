import { env } from "@/lib/env";

export function getBaseUrl() {
  return env.appUrl;
}

export function currencyFormatter(amountInCents: number, currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}


