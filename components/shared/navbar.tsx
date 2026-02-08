"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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

type NavbarUser = {
  email: string;
  fullName?: string | null;
};

function getUserLabel(user: NavbarUser) {
  const name = user.fullName?.trim();
  if (name) return name.split(/\s+/)[0];
  return user.email.split("@")[0] ?? user.email;
}

export function Navbar({
  showServices = false,
  currentUser,
}: {
  showServices?: boolean;
  currentUser?: NavbarUser | null;
}) {
  const pathname = usePathname();
  const { lang, t, toggle } = useTranslation();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
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
          <Link
            href="/"
            className="inline-flex flex-shrink-0 items-center gap-2.5 font-heading text-lg font-bold tracking-tight text-white"
          >
            ProLevelCode
          </Link>

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

            {currentUser ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="navbar-login-btn">
                    {getUserLabel(currentUser)}
                  </Button>
                </Link>
                <form action="/api/auth/logout" method="post">
                  <Button variant="ghost" size="sm" className="navbar-login-btn" type="submit">
                    {t.nav.logout}
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="navbar-login-btn">
                  {t.nav.login}
                </Button>
              </Link>
            )}

            {showServices && (
              <Link href="/servicios">
                <Button size="sm" className="navbar-cta-btn">
                  {t.nav.hire}
                </Button>
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
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
                {currentUser ? (
                  <>
                    <Link href="/dashboard" onClick={closeMenu}>
                      <Button variant="ghost" size="sm" className="h-9 w-full">
                        {getUserLabel(currentUser)}
                      </Button>
                    </Link>
                    <form action="/api/auth/logout" method="post" onSubmit={closeMenu}>
                      <Button variant="ghost" size="sm" className="h-9 w-full" type="submit">
                        {t.nav.logout}
                      </Button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="h-9 w-full">
                      {t.nav.login}
                    </Button>
                  </Link>
                )}

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
