export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Auth
  authSecret: process.env.AUTH_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,

  // MercadoPago
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,

  // Currency
  usdToClpRate: Number(process.env.USD_TO_CLP_RATE ?? 950),

  // Email
  resendApiKey: process.env.RESEND_API_KEY,

  // Admin
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),

  // Video tokens
  tokenDefaultTtl: Number(process.env.TOKEN_DEFAULT_TTL ?? 14_400),
  tokenDefaultMaxViews: Number(process.env.TOKEN_DEFAULT_MAX_VIEWS ?? 3),
  tokenIpMode: process.env.TOKEN_IP_MODE ?? "flex",
};

export function requireEnv<T extends keyof typeof env>(key: T): NonNullable<(typeof env)[T]> {
  const value = env[key];

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as NonNullable<(typeof env)[T]>;
}
