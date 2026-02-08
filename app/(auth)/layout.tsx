export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container-wide flex min-h-screen items-center justify-center py-12">
      <div className="liquid-form-shell w-full max-w-md p-6">{children}</div>
    </main>
  );
}


