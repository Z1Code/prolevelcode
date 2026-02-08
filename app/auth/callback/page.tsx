"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function resolveNext(searchParams: URLSearchParams) {
  const directNext = searchParams.get("next");
  if (directNext && directNext.startsWith("/")) {
    return directNext;
  }

  const continueUrl = searchParams.get("continueUrl");
  if (!continueUrl) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(continueUrl);
    const nestedNext = parsed.searchParams.get("next");
    if (nestedNext && nestedNext.startsWith("/")) {
      return nestedNext;
    }

    if (parsed.pathname.startsWith("/")) {
      return parsed.pathname;
    }
  } catch {
    return "/dashboard";
  }

  return "/dashboard";
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Validando autenticacion...");

  const next = useMemo(() => resolveNext(searchParams), [searchParams]);

  useEffect(() => {
    let active = true;

    async function run() {
      const mode = searchParams.get("mode");
      const oobCode = searchParams.get("oobCode");
      const currentUrl = window.location.href;

      try {
        if (mode === "verifyEmail" && oobCode) {
          setStatus("Confirmando correo...");
          await applyActionCode(getFirebaseClientAuth(), oobCode);
          router.replace("/login?message=" + encodeURIComponent("Email verificado. Ya puedes iniciar sesion."));
          return;
        }

        if (mode === "resetPassword" && oobCode) {
          router.replace(`/recuperar?oobCode=${encodeURIComponent(oobCode)}`);
          return;
        }

        if (isSignInWithEmailLink(getFirebaseClientAuth(), currentUrl)) {
          setStatus("Completando magic link...");

          let email = window.localStorage.getItem("plc_magic_link_email") ?? searchParams.get("email") ?? "";
          if (!email) {
            const prompted = window.prompt("Confirma tu email para continuar");
            email = prompted?.trim() ?? "";
          }

          if (!email) {
            router.replace("/login?error=" + encodeURIComponent("No se pudo validar el email del magic link"));
            return;
          }

          const credential = await signInWithEmailLink(getFirebaseClientAuth(), email, currentUrl);
          const idToken = await credential.user.getIdToken();
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? "No se pudo crear sesion");
          }

          window.localStorage.removeItem("plc_magic_link_email");
          router.replace(next);
          return;
        }

        router.replace(next);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "No se pudo completar autenticacion";
        router.replace("/login?error=" + encodeURIComponent(message));
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [next, router, searchParams]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="liquid-surface px-6 py-5 text-sm text-slate-200">{status}</div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="liquid-surface px-6 py-5 text-sm text-slate-200">Validando autenticacion...</div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
