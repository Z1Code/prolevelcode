export const TIERS = {
  basic: {
    id: "basic",
    name: "Basic",
    priceCents: 2900, // $29 USD
    priceDisplay: "$29",
    currency: "USD",
    description: "Acceso a todos los cursos fundamentales de desarrollo web",
    features: [
      "HTML & CSS",
      "JavaScript",
      "React",
      "Next.js",
      "Node.js & Backend",
      "Bases de Datos",
      "Acceso de por vida",
      "Actualizaciones incluidas",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 9900, // $99 USD
    priceDisplay: "$99",
    currency: "USD",
    description: "Acceso completo a todos los cursos, incluyendo DevOps y Crypto",
    features: [
      "Todo lo de Basic",
      "DevOps & Deploy",
      "Crypto Trading",
      "Crypto DeFi",
      "Consultas directas al instructor",
      "1 beca Basic para un amigo (30 dias)",
      "Acceso de por vida",
      "Acceso anticipado a nuevos cursos",
    ],
  },
} as const;

export type TierId = keyof typeof TIERS;

export function getTierConfig(tier: TierId) {
  return TIERS[tier];
}

/** Price in USDT for Binance Pay (same dollar value) */
export function getTierPriceUsdt(tier: TierId): string {
  return (TIERS[tier].priceCents / 100).toFixed(2);
}

/** First N Pro purchasers get a permanent (lifetime) scholarship instead of 30-day */
export const EARLY_PRO_LIMIT = 6;
