import { guideCatalog } from "./catalog";
import type { Guide, GuidePhase } from "./types";

const allGuides: Guide[] = guideCatalog.flatMap((phase) => phase.guides);

export function getGuideBySlug(slug: string): Guide | undefined {
  return allGuides.find((g) => g.slug === slug);
}

export function getPhaseForGuide(slug: string): GuidePhase | undefined {
  return guideCatalog.find((phase) => phase.guides.some((g) => g.slug === slug));
}

export function getAdjacentGuides(slug: string): { prev: Guide | null; next: Guide | null } {
  const idx = allGuides.findIndex((g) => g.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? allGuides[idx - 1] : null,
    next: idx < allGuides.length - 1 ? allGuides[idx + 1] : null,
  };
}

export function getAllGuideSlugs(): string[] {
  return allGuides.map((g) => g.slug);
}
