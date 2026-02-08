import { env } from "@/lib/env";

/**
 * Convert USD cents to CLP integer (whole pesos).
 * MercadoPago Chile only accepts CLP with no decimals.
 */
export function convertUsdToCLP(amountCents: number): number {
  const rate = env.usdToClpRate;
  // cents → dollars → CLP, rounded to nearest integer
  return Math.round((amountCents / 100) * rate);
}
