"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function createClient() {
  return {
    auth: {
      async signInWithOAuth({ provider }: { provider: "google" }) {
        if (provider !== "google") {
          return { data: null, error: { message: "Only Google is supported" } };
        }

        try {
          const credential = await signInWithPopup(getFirebaseClientAuth(), new GoogleAuthProvider());
          const idToken = await credential.user.getIdToken();

          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            return { data: null, error: { message: payload?.error ?? "Could not create server session" } };
          }

          return { data: credential, error: null };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : "Google sign-in failed" },
          };
        }
      },
      async signOut() {
        await signOut(getFirebaseClientAuth());
        await fetch("/api/auth/session", { method: "DELETE" });
        return { error: null };
      },
    },
  };
}
