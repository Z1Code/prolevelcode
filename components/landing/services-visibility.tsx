"use client";

import { useTranslation } from "@/lib/i18n/language-provider";

export function ServicesVisibility({ children }: { children: React.ReactNode }) {
  const { showServices } = useTranslation();
  if (!showServices) return null;
  return <>{children}</>;
}
