import Link from "next/link";
import { registerAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/shared/google-login-button";

interface RegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <>
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="mt-2 text-sm text-slate-400">Necesitas cuenta para pagar y acceder a cursos.</p>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <form action={registerAction} className="mt-6 space-y-3">
        <Input name="fullName" placeholder="Nombre completo" required />
        <Input name="email" type="email" placeholder="tu@email.com" required />
        <Input name="password" type="password" placeholder="Crea tu contrasena" required />
        <Button type="submit" className="w-full">
          Registrarme
        </Button>
      </form>

      <div className="my-4 h-px bg-white/10" />
      <GoogleLoginButton />

      <p className="mt-6 text-sm text-slate-400">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="liquid-link font-medium">
          Inicia sesion
        </Link>
      </p>
    </>
  );
}
