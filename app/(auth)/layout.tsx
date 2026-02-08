import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container-wide flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mb-4 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-white/5 hover:text-white"
        >
          ← Inicio
        </Link>
      </div>
      <div className="liquid-form-shell w-full max-w-md p-6">{children}</div>
    </main>
  );
}


