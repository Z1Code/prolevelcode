import { MercadoPagoConfig } from "mercadopago";
import { requireEnv } from "@/lib/env";

let mpSingleton: MercadoPagoConfig | undefined;

export function getMercadoPagoClient() {
  if (!mpSingleton) {
    mpSingleton = new MercadoPagoConfig({
      accessToken: requireEnv("mercadoPagoAccessToken"),
      options: { timeout: 10_000 },
    });
  }
  return mpSingleton;
}
