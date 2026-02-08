export function Footer() {
  return (
    <footer className="footer-section px-4 pb-6 pt-14">
      <div className="container-wide footer-shell px-6 py-10 md:px-8">
        <div className="footer-glass-shimmer" aria-hidden />
        <div className="footer-glass-refraction" aria-hidden />

        <div className="relative z-[1] grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-slate-100">ProLevelCode</h3>
            <p className="text-sm text-slate-300">Desarrollo web e IA para productos que realmente escalan.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Social</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="https://x.com/7uanf" target="_blank" rel="noreferrer" className="liquid-link">
                  X / @7uanf
                </a>
              </li>
              <li>
                <a href="https://github.com/Z1Code" target="_blank" rel="noreferrer" className="liquid-link">
                  GitHub / Z1Code
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-[1] mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">Copyright 2026 ProLevelCode | Velocity Software</p>
        </div>
      </div>
    </footer>
  );
}
