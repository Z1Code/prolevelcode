/* ─── BSC (BNB Smart Chain) ─── */
export const USDT_BEP20_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
export const BSC_CHAIN_ID = 56;
export const BSC_EXPLORER = "https://bscscan.com";

/* ─── Solana ─── */
export const USDT_SOL_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
export const SOLANA_EXPLORER = "https://solscan.io";

/* ─── Binance Pay (manual verification) ─── */
export const BINANCE_ID = process.env.NEXT_PUBLIC_BINANCE_ID ?? "";

/* ─── Payment settings ─── */
export const CRYPTO_PAYMENT_EXPIRY_MINUTES = 60;
export const CRYPTO_POLL_INTERVAL_MS = 15_000;

/**
 * Generate a unique USDT amount by adding random cents to distinguish payments.
 * E.g. $30.00 becomes $30.01–$30.97
 */
export function generateUniqueAmount(basePriceCents: number): string {
  const baseDollars = basePriceCents / 100;
  const randomCents = Math.floor(Math.random() * 97) + 1; // 1–97
  const uniqueAmount = baseDollars + randomCents / 100;
  return uniqueAmount.toFixed(2);
}
