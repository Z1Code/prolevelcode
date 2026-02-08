import Link from "next/link";

export function Footer() {
  return (
    <footer className="liquid-section py-14">
      <div className="container-wide liquid-surface px-6 py-10 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="mb-3 font-semibold text-slate-100">ProLevelCode</h3>
            <p className="text-sm text-slate-300">Desarrollo web e IA para productos que realmente escalan.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/servicios" className="liquid-link">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="liquid-link">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/sobre-mi" className="liquid-link">
                  Sobre mi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/terminos" className="liquid-link">
                  Terminos
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="liquid-link">
                  Privacidad
                </Link>
              </li>
              <li>
                <span>No refunds en servicios</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Social</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="liquid-link">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="liquid-link">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="liquid-link">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">
            Copyright {new Date().getFullYear()} ProLevelCode. Hecho con Next.js y cafe.
          </p>
        </div>
      </div>
    </footer>
  );
}
