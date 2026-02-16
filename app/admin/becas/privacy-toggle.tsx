"use client";

import { useState } from "react";

export function PrivacyToggle({
  children,
  headerActions,
}: {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className={hidden ? "privacy-on" : ""}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Becas</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHidden(!hidden)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-white/10 hover:text-white"
            title={hidden ? "Mostrar datos personales" : "Ocultar datos personales"}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              {hidden ? (
                <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
              ) : (
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              )}
              {hidden ? (
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              ) : (
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              )}
            </svg>
            {hidden ? "Mostrar" : "Ocultar"}
          </button>
          {headerActions}
        </div>
      </div>
      {children}
    </div>
  );
}
