import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-wide flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-slate-400">404</p>
      <h1 className="mt-2 text-4xl font-bold">Pagina no encontrada</h1>
      <p className="mt-3 text-slate-300">La ruta que buscas no existe o ya no esta disponible.</p>
      <Link href="/" className="liquid-surface-soft mt-6 rounded-full px-4 py-2 text-sm">
        Volver al inicio
      </Link>
    </main>
  );
}
