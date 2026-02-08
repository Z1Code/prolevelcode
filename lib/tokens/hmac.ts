import { createHmac } from "crypto";

function getSecret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("Missing AUTH_SECRET environment variable");
  return raw;
}

interface VideoSignaturePayload {
  tokenId: string;
  userId: string;
  exp: number;
}

export function signVideoAccess(tokenId: string, userId: string, ttlSeconds = 14400): string {
  const payload: VideoSignaturePayload = {
    tokenId,
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", getSecret()).update(data).digest("hex");

  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

export function verifyVideoAccess(signed: string): VideoSignaturePayload | null {
  try {
    const decoded = Buffer.from(signed, "base64url").toString();
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return null;

    const data = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);

    const expected = createHmac("sha256", getSecret()).update(data).digest("hex");

    if (signature.length !== expected.length) return null;

    // Constant-time comparison
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(data) as VideoSignaturePayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
