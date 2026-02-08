import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let stripeSingleton: Stripe | undefined;

export function getStripeServerClient() {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(requireEnv("stripeSecretKey"), {
      appInfo: {
        name: "prolevelcode",
      },
      apiVersion: "2026-01-28.clover",
    });
  }

  return stripeSingleton;
}



