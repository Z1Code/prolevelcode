import { recoverAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "./reset-password-form";

interface RecoverPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RecoverPage({ searchParams }: RecoverPageProps) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;
  const oobCode = typeof params.oobCode === "string" ? params.oobCode : null;

  return (
    <>
      <h1 className="text-2xl font-semibold">Recuperar contrasena</h1>
      <p className="mt-2 text-sm text-slate-400">Te enviaremos un enlace para restablecer acceso.</p>
      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {oobCode ? (
        <ResetPasswordForm oobCode={oobCode} />
      ) : (
        <form action={recoverAction} className="mt-6 space-y-3">
          <Input name="email" type="email" placeholder="tu@email.com" required />
          <Button type="submit" className="w-full">
            Enviar enlace
          </Button>
        </form>
      )}
    </>
  );
}
