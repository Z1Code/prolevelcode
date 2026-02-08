import { env } from "@/lib/env";

interface FirebaseErrorPayload {
  error?: {
    message?: string;
  };
}

export async function firebaseAuthRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = env.firebaseApiKey;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & FirebaseErrorPayload;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Firebase auth request failed");
  }

  return payload;
}
