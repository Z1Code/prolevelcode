import Link from "next/link";
import { loginAction, magicLinkAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLoginButton } from "@/components/shared/google-login-button";
import { LoginCountdown } from "./login-countdown";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;

  const isAdmin = next.startsWith("/admin");

  return (
    <LoginCountdown skip={isAdmin}>
      <h1 className="text-2xl font-semibold">Iniciar sesion</h1>
      <p className="mt-2 text-sm text-slate-400">Accede para comprar y ver tus cursos.</p>

      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <form action={loginAction} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next} />
        <Input name="email" type="email" placeholder="tu@email.com" required />
        <Input name="password" type="password" placeholder="Contrasena" required />
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>

      <form action={magicLinkAction} className="mt-3 space-y-3">
        <input type="hidden" name="next" value={next} />
        <Input name="email" type="email" placeholder="Magic link por email" required />
        <Button type="submit" variant="ghost" className="w-full">
          Enviar magic link
        </Button>
      </form>

      <div className="my-4 h-px bg-white/10" />
      <GoogleLoginButton next={next} />

      <p className="mt-6 text-sm text-slate-400">
        No tienes cuenta?{" "}
        <Link href="/registro" className="liquid-link font-medium">
          Registrate
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-400">
        <Link href="/recuperar" className="liquid-link font-medium">
          Recuperar contrasena
        </Link>
      </p>
    </LoginCountdown>
  );
}
