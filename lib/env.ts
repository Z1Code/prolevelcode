export const env = {
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim(),

  // Auth
  authSecret: process.env.AUTH_SECRET?.trim(),
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim(),
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),

  // MercadoPago
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim(),
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),

  // Currency
  usdToClpRate: Number((process.env.USD_TO_CLP_RATE ?? "950").trim()),

  // Email
  resendApiKey: process.env.RESEND_API_KEY?.trim(),

  // Admin
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),

  // Video tokens
  tokenDefaultTtl: Number((process.env.TOKEN_DEFAULT_TTL ?? "14400").trim()),
  tokenDefaultMaxViews: Number((process.env.TOKEN_DEFAULT_MAX_VIEWS ?? "3").trim()),
  tokenIpMode: (process.env.TOKEN_IP_MODE ?? "flex").trim(),

  // Bunny Stream
  bunnyStreamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID?.trim(),
  bunnyStreamApiKey: process.env.BUNNY_STREAM_API_KEY?.trim(),
  bunnyStreamCdnHost: process.env.BUNNY_STREAM_CDN_HOST?.trim(),
  bunnyStreamTokenKey: process.env.BUNNY_STREAM_TOKEN_KEY?.trim(),

  // Binance Pay (optional - merchant API)
  binancePayApiKey: process.env.BINANCE_PAY_API_KEY?.trim(),
  binancePaySecretKey: process.env.BINANCE_PAY_SECRET_KEY?.trim(),

  // Crypto payments (direct wallet)
  cryptoWalletAddress: process.env.CRYPTO_WALLET_ADDRESS?.trim(),
  cryptoSolanaAddress: process.env.CRYPTO_SOLANA_ADDRESS?.trim(),
  bscscanApiKey: process.env.BSCSCAN_API_KEY?.trim(),
};

export function requireEnv<T extends keyof typeof env>(key: T): NonNullable<(typeof env)[T]> {
  const value = env[key];

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as NonNullable<(typeof env)[T]>;
}
