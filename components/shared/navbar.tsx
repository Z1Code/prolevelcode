"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/servicios", key: "services" as const },
  { href: "/cursos", key: "courses" as const },
  { href: "/sobre-mi", key: "about" as const },
  { href: "/contacto", key: "contact" as const },
];

export function Navbar() {
  const pathname = usePathname();
  const { lang, t, toggle, showServices, toggleServices } = useTranslation();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isOpen = openForPath === pathname;

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMenu = () => setOpenForPath(null);
  const toggleMenu = () => setOpenForPath((prev) => (prev === pathname ? null : pathname));

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenForPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".settings-panel-container")) {
        setSettingsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  const settingsDropdown = (mobile?: boolean) => (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn("settings-dropdown", mobile && "settings-dropdown-mobile")}
        >
          <p className="settings-dropdown-title">
            {lang === "es" ? "Configuracion" : "Settings"}
          </p>
          <label className="settings-toggle-row">
            <span className="settings-toggle-label">
              {lang === "es" ? "Mostrar Servicios" : "Show Services"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showServices}
              onClick={toggleServices}
              className={cn("settings-switch", showServices && "settings-switch-on")}
            >
              <span className="settings-switch-thumb" />
            </button>
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div
        className={cn(
          "container-wide navbar-shell transition-all duration-300",
          isScrolled && "navbar-shell-scrolled",
          isOpen && "navbar-shell-open",
        )}
      >
        <div className="navbar-glass-shimmer" aria-hidden />
        <div className="navbar-glass-refraction" aria-hidden />

        <div className="relative flex h-[64px] items-center px-5 sm:px-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="inline-flex flex-shrink-0 items-center gap-2.5 font-heading text-lg font-bold tracking-tight text-white"
          >
            <span className="navbar-brand-dot" aria-hidden />
            ProLevelCode
          </Link>

          {/* Center: Nav links */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("navbar-link", isActiveLink(item.href) && "navbar-link-active")}
                aria-current={isActiveLink(item.href) ? "page" : undefined}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          {/* Right: Settings + Lang + Login + CTA */}
          <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
            <button
              onClick={toggle}
              className="navbar-lang-toggle"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a Espanol"}
            >
              <span className={cn("navbar-lang-option", lang === "es" && "navbar-lang-active")}>ES</span>
              <span className="navbar-lang-sep">/</span>
              <span className={cn("navbar-lang-option", lang === "en" && "navbar-lang-active")}>EN</span>
            </button>

            <Link href="/login">
              <Button variant="ghost" size="sm" className="navbar-login-btn">
                {t.nav.login}
              </Button>
            </Link>

            {showServices && (
              <Link href="/servicios">
                <Button size="sm" className="navbar-cta-btn">
                  {t.nav.hire}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile toggle area */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div className="settings-panel-container relative">
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen((p) => !p); }}
                className="navbar-icon-btn"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              {settingsDropdown(true)}
            </div>

            <button
              onClick={toggle}
              className="navbar-lang-toggle"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a Espanol"}
            >
              <span className={cn("navbar-lang-option", lang === "es" && "navbar-lang-active")}>ES</span>
              <span className="navbar-lang-sep">/</span>
              <span className={cn("navbar-lang-option", lang === "en" && "navbar-lang-active")}>EN</span>
            </button>

            <button
              aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="navbar-mobile-toggle"
              onClick={toggleMenu}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ opacity: 0, rotate: 60, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -60, scale: 0.7 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.button
            type="button"
            aria-label="Cerrar menu movil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-[#02050d]/70 backdrop-blur-[2px] lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="container-wide relative z-50 mt-2 lg:hidden"
          >
            <div className="navbar-mobile-panel">
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn("navbar-mobile-link", isActiveLink(item.href) && "navbar-mobile-link-active")}
                    aria-current={isActiveLink(item.href) ? "page" : undefined}
                  >
                    {t.nav[item.key]}
                  </Link>
                ))}
              </nav>

              <div
                className={cn(
                  "mt-4 grid gap-2 border-t border-white/10 pt-4",
                  showServices ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <Link href="/login" onClick={closeMenu}>
                  <Button variant="ghost" size="sm" className="h-9 w-full">
                    {t.nav.login}
                  </Button>
                </Link>
                {showServices && (
                  <Link href="/servicios" onClick={closeMenu}>
                    <Button size="sm" className="h-9 w-full">
                      {t.nav.hire}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
