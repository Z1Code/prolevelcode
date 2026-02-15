"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/becas", key: "scholarships" as const },
  { href: "https://7uanf.com/", key: "about" as const, external: true },
  { href: "/contacto", key: "contact" as const },
];

const learnSubitems = [
  { href: "/guias", key: "guides" as const, desc: { es: "Aprende paso a paso", en: "Learn step by step" } },
  { href: "/cursos", key: "courses" as const, desc: { es: "Cursos con video", en: "Video courses" } },
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

const DISCORD_INVITE = "https://discord.gg/RHGdMW6B";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function Navbar({
  currentUser,
  userTier,
}: {
  currentUser?: NavbarUser | null;
  userTier?: "pro" | "basic" | null;
}) {
  const pathname = usePathname();
  const { lang, t, toggle } = useTranslation();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [mobileLearnOpen, setMobileLearnOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const learnBtnRef = useRef<HTMLButtonElement>(null);
  const learnWrapRef = useRef<HTMLDivElement>(null);
  const learnTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOpen = openForPath === pathname;

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isLearnActive = learnSubitems.some((item) => isActiveLink(item.href));
  const closeMenu = () => {
    setOpenForPath(null);
    setMobileLearnOpen(false);
  };
  const toggleMenu = () => setOpenForPath((prev) => (prev === pathname ? null : pathname));

  // Measure button viewport position for fixed dropdown placement
  const measureBtn = useCallback(() => {
    const btn = learnBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setDropdownPos({
      left: r.left + r.width / 2,
      top: r.bottom + 8,
    });
  }, []);

  const openLearnDropdown = useCallback(() => {
    measureBtn();
    setLearnOpen(true);
  }, [measureBtn]);

  const handleLearnEnter = useCallback(() => {
    clearTimeout(learnTimeout.current);
    learnTimeout.current = setTimeout(openLearnDropdown, 80);
  }, [openLearnDropdown]);

  const handleLearnLeave = useCallback(() => {
    clearTimeout(learnTimeout.current);
    learnTimeout.current = setTimeout(() => setLearnOpen(false), 200);
  }, []);

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

  // Close dropdown on route change
  useEffect(() => {
    setLearnOpen(false);
    setMobileLearnOpen(false);
  }, [pathname]);

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
            {/* "Aprender" trigger — dropdown renders outside the shell */}
            <div
              ref={learnWrapRef}
              onMouseEnter={handleLearnEnter}
              onMouseLeave={handleLearnLeave}
            >
              <button
                ref={learnBtnRef}
                type="button"
                onClick={() => {
                  if (learnOpen) {
                    setLearnOpen(false);
                  } else {
                    openLearnDropdown();
                  }
                }}
                className={cn(
                  "navbar-link inline-flex items-center gap-1",
                  isLearnActive && "navbar-link-active",
                )}
              >
                {t.nav.learn}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    learnOpen && "rotate-180",
                  )}
                />
              </button>
            </div>

            {navItems.map((item) =>
              "external" in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="navbar-link"
                >
                  {t.nav[item.key]}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("navbar-link", isActiveLink(item.href) && "navbar-link-active")}
                  aria-current={isActiveLink(item.href) ? "page" : undefined}
                >
                  {t.nav[item.key]}
                </Link>
              ),
            )}
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

            {userTier && (
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-[#5865F2]"
                aria-label="Discord"
              >
                <DiscordIcon className="h-4.5 w-4.5" />
              </a>
            )}

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

      {/* ── Desktop "Aprender" dropdown — rendered OUTSIDE navbar-shell to avoid overflow:hidden clipping ── */}
      <AnimatePresence>
        {learnOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none fixed z-[60] hidden w-56 lg:block"
            style={{
              left: dropdownPos.left - 112,
              top: dropdownPos.top,
            }}
            onMouseEnter={handleLearnEnter}
            onMouseLeave={handleLearnLeave}
          >
            <div className="pointer-events-auto navbar-dropdown-glass w-56 p-2">
              <div className="navbar-dropdown-shimmer" aria-hidden />
              <div className="navbar-dropdown-refraction" aria-hidden />
              <div className="relative z-10">
                {learnSubitems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setLearnOpen(false)}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors duration-150",
                      isActiveLink(item.href)
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/7 hover:text-white",
                    )}
                  >
                    <span className="text-[13.5px] font-semibold">{t.nav[item.key]}</span>
                    <span className="text-[11px] text-slate-500">{item.desc[lang]}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {/* Mobile "Aprender" accordion */}
                <button
                  type="button"
                  onClick={() => setMobileLearnOpen((v) => !v)}
                  className={cn(
                    "navbar-mobile-link justify-between",
                    isLearnActive && "navbar-mobile-link-active",
                  )}
                >
                  {t.nav.learn}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      mobileLearnOpen && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {mobileLearnOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 flex flex-col gap-1 border-l border-white/8 pl-3">
                        {learnSubitems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className={cn(
                              "navbar-mobile-link text-sm",
                              isActiveLink(item.href) && "navbar-mobile-link-active",
                            )}
                            aria-current={isActiveLink(item.href) ? "page" : undefined}
                          >
                            {t.nav[item.key]}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {navItems.map((item) =>
                  "external" in item && item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="navbar-mobile-link"
                    >
                      {t.nav[item.key]}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn("navbar-mobile-link", isActiveLink(item.href) && "navbar-mobile-link-active")}
                      aria-current={isActiveLink(item.href) ? "page" : undefined}
                    >
                      {t.nav[item.key]}
                    </Link>
                  ),
                )}
              </nav>

              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-4">
                {userTier && (
                  <a
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="navbar-mobile-link flex items-center gap-2"
                  >
                    <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                    Discord
                  </a>
                )}
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

              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
