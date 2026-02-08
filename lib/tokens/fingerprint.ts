"use client";

export async function getDeviceFingerprint(): Promise<string> {
  const signals = [
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.language,
    navigator.hardwareConcurrency,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
    navigator.userAgent,
  ].join("|");

  const encoder = new TextEncoder();
  const data = encoder.encode(signals);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
