"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { translations, type Language, type Translations } from "./translations";

type LanguageContextType = {
  lang: Language;
  t: Translations;
  toggle: () => void;
  showServices: boolean;
  toggleServices: () => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  t: translations.es,
  toggle: () => {},
  showServices: true,
  toggleServices: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === "undefined") return "es";
    const stored = localStorage.getItem("lang");
    return stored === "es" || stored === "en" ? stored : "es";
  });

  const [showServices, setShowServices] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("showServices");
    return stored !== null ? stored === "true" : true;
  });

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "es" ? "en" : "es";
      localStorage.setItem("lang", next);
      return next;
    });
  }, []);

  const toggleServices = useCallback(() => {
    setShowServices((prev) => {
      const next = !prev;
      localStorage.setItem("showServices", String(next));
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggle, showServices, toggleServices }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
