import { env } from "@/lib/env";
import { USDT_BEP20_CONTRACT, USDT_SOL_MINT, SOLANA_RPC } from "./config";

/* ─── Shared return type ─── */
export interface TransferMatch {
  txHash: string;
  from: string;
  network: "bsc" | "solana";
}

/* ═══════════════════════════════════════════════════════════
   BSC (BEP-20) — via BSCScan API
   ═══════════════════════════════════════════════════════════ */

interface BscTokenTransfer {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
}

interface BscApiResponse {
  status: string;
  result: BscTokenTransfer[] | string;
}

export async function findBscTransfer(
  amountUsdt: string,
  sinceTimestamp: number,
): Promise<TransferMatch | null> {
  const walletAddress = env.cryptoWalletAddress;
  const apiKey = env.bscscanApiKey;

  if (!walletAddress || !apiKey) return null;

  const url = new URL("https://api.bscscan.com/api");
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("contractaddress", USDT_BEP20_CONTRACT);
  url.searchParams.set("address", walletAddress);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", "50");
  url.searchParams.set("sort", "desc");
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = (await res.json()) as BscApiResponse;
  if (data.status !== "1" || !Array.isArray(data.result)) return null;

  // USDT on BSC uses 18 decimals
  const expectedRaw = toRawDecimals(amountUsdt, 18);

  for (const tx of data.result) {
    if (parseInt(tx.timeStamp, 10) < sinceTimestamp) continue;
    if (tx.to.toLowerCase() !== walletAddress.toLowerCase()) continue;
    if (tx.value === expectedRaw) {
      return { txHash: tx.hash, from: tx.from, network: "bsc" };
    }
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════
   Solana — via public RPC (getSignaturesForAddress + getTransaction)
   ═══════════════════════════════════════════════════════════ */

export async function findSolanaTransfer(
  amountUsdt: string,
  sinceTimestamp: number,
): Promise<TransferMatch | null> {
  const walletAddress = env.cryptoSolanaAddress;
  if (!walletAddress) return null;

  try {
    // 1. Find our USDT token account
    const tokenAccounts = await solanaRpc("getTokenAccountsByOwner", [
      walletAddress,
      { mint: USDT_SOL_MINT },
      { encoding: "jsonParsed" },
    ]);

    const accounts = tokenAccounts?.result?.value;
    if (!accounts || accounts.length === 0) return null;

    const tokenAccountPubkey = accounts[0].pubkey;

    // 2. Get recent signatures for the token account
    const sigsResult = await solanaRpc("getSignaturesForAddress", [
      tokenAccountPubkey,
      { limit: 30 },
    ]);

    const signatures = sigsResult?.result;
    if (!Array.isArray(signatures) || signatures.length === 0) return null;

    // USDT on Solana uses 6 decimals
    const expectedLamports = toRawDecimals(amountUsdt, 6);

    // 3. Check each transaction for matching transfer
    for (const sig of signatures) {
      if (sig.err) continue;
      const blockTime = sig.blockTime;
      if (blockTime && blockTime < sinceTimestamp) continue;

      const txResult = await solanaRpc("getTransaction", [
        sig.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);

      const tx = txResult?.result;
      if (!tx) continue;

      // Check pre/post token balances for our account
      const preBalances = tx.meta?.preTokenBalances ?? [];
      const postBalances = tx.meta?.postTokenBalances ?? [];

      for (const post of postBalances) {
        if (post.mint !== USDT_SOL_MINT) continue;
        if (post.owner !== walletAddress) continue;

        const pre = preBalances.find(
          (p: { accountIndex: number }) => p.accountIndex === post.accountIndex,
        );
        const preBal = pre?.uiTokenAmount?.amount ?? "0";
        const postBal = post.uiTokenAmount?.amount ?? "0";
        const received = BigInt(postBal) - BigInt(preBal);

        if (received.toString() === expectedLamports) {
          // Find sender from the instructions
          const sender = findSolanaSender(tx) ?? "unknown";
          return { txHash: sig.signature, from: sender, network: "solana" };
        }
      }
    }
  } catch (err) {
    console.error("[findSolanaTransfer] Error:", err);
  }

  return null;
}

/* ─── Combined checker: tries both chains in parallel ─── */

export async function findMatchingTransfer(
  amountUsdt: string,
  sinceTimestamp: number,
): Promise<TransferMatch | null> {
  const [bsc, sol] = await Promise.allSettled([
    findBscTransfer(amountUsdt, sinceTimestamp),
    findSolanaTransfer(amountUsdt, sinceTimestamp),
  ]);

  if (bsc.status === "fulfilled" && bsc.value) return bsc.value;
  if (sol.status === "fulfilled" && sol.value) return sol.value;

  return null;
}

/* ─── Helpers ─── */

function toRawDecimals(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  const padded = frac.padEnd(decimals, "0").slice(0, decimals);
  return `${whole}${padded}`.replace(/^0+/, "") || "0";
}

async function solanaRpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC error: ${res.status}`);
  return res.json();
}

function findSolanaSender(tx: any): string | null {
  try {
    const instructions =
      tx.transaction?.message?.instructions ?? [];
    for (const ix of instructions) {
      if (
        ix.parsed?.type === "transferChecked" ||
        ix.parsed?.type === "transfer"
      ) {
        return ix.parsed.info?.source ?? ix.parsed.info?.authority ?? null;
      }
    }
    // Fallback: first signer
    const signers =
      tx.transaction?.message?.accountKeys?.filter(
        (k: { signer: boolean }) => k.signer,
      ) ?? [];
    return signers[0]?.pubkey ?? null;
  } catch {
    return null;
  }
}
