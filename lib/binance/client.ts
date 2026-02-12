import crypto from "crypto";
import { requireEnv } from "@/lib/env";

interface BinanceOrderParams {
  merchantTradeNo: string;
  totalAmount: string;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}

interface BinanceOrderResponse {
  status: string;
  code: string;
  data: {
    prepayId: string;
    terminalType: string;
    expireTime: number;
    qrcodeLink: string;
    qrContent: string;
    checkoutUrl: string;
    deeplink: string;
    universalUrl: string;
  };
}

function generateNonce(length = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function signPayload(timestamp: string, nonce: string, body: string, secretKey: string): string {
  const payload = `${timestamp}\n${nonce}\n${body}\n`;
  return crypto.createHmac("sha512", secretKey).update(payload).digest("hex").toUpperCase();
}

/**
 * Create a Binance Pay order via the V2 API.
 */
export async function createBinanceOrder(params: BinanceOrderParams): Promise<BinanceOrderResponse> {
  const apiKey = requireEnv("binancePayApiKey");
  const secretKey = requireEnv("binancePaySecretKey");

  const timestamp = Date.now().toString();
  const nonce = generateNonce();

  const body = JSON.stringify({
    env: {
      terminalType: "WEB",
    },
    merchantTradeNo: params.merchantTradeNo,
    orderAmount: params.totalAmount,
    currency: params.currency,
    description: params.description,
    goodsDetails: [
      {
        goodsType: "02", // virtual goods
        goodsCategory: "Z000", // others
        referenceGoodsId: params.merchantTradeNo,
        goodsName: params.description,
        goodsDetail: params.description,
      },
    ],
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    webhookUrl: params.webhookUrl,
  });

  const signature = signPayload(timestamp, nonce, body, secretKey);

  const response = await fetch("https://bpay.binanceapi.com/binancepay/openapi/v3/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": apiKey,
      "BinancePay-Signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Binance Pay API error: ${response.status} ${text}`);
  }

  const result = (await response.json()) as BinanceOrderResponse;

  if (result.status !== "SUCCESS") {
    throw new Error(`Binance Pay order failed: ${result.code} ${result.status}`);
  }

  return result;
}

/**
 * Verify a Binance Pay webhook signature using HMAC-SHA512.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyBinanceWebhook(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
): boolean {
  const secretKey = requireEnv("binancePaySecretKey");
  const expectedSig = signPayload(timestamp, nonce, body, secretKey);

  if (expectedSig.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}
