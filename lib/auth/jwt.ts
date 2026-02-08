import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";

const ALG = "HS256";

function getSecret() {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) throw new Error("Missing AUTH_SECRET environment variable");
  return new TextEncoder().encode(raw);
}

export interface SessionPayload {
  sub: string;
  email: string;
  sid: string;
}

export async function signSessionToken(payload: SessionPayload, expiresIn = "7d"): Promise<string> {
  return new SignJWT({ email: payload.email, sid: payload.sid })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.sid !== "string") {
      return null;
    }
    return { sub: payload.sub, email: payload.email, sid: payload.sid };
  } catch {
    return null;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
