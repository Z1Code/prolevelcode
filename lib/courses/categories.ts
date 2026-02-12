export interface CourseCategory {
  slug: string;
  name: string;
  tier: "basic" | "pro";
  status: "active" | "coming_soon";
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  { slug: "html_css", name: "HTML & CSS", tier: "basic", status: "active" },
  { slug: "javascript", name: "JavaScript", tier: "basic", status: "active" },
  { slug: "react", name: "React", tier: "basic", status: "active" },
  { slug: "nextjs", name: "Next.js", tier: "basic", status: "active" },
  { slug: "nodejs", name: "Node.js & Backend", tier: "basic", status: "active" },
  { slug: "databases", name: "Bases de Datos", tier: "basic", status: "active" },
  { slug: "devops", name: "DevOps & Deploy", tier: "pro", status: "active" },
  { slug: "crypto_trading", name: "Crypto Trading", tier: "pro", status: "coming_soon" },
  { slug: "crypto_defi", name: "Crypto DeFi", tier: "pro", status: "coming_soon" },
];

export function getCategoryBySlug(slug: string) {
  return COURSE_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getCategoriesByTier(tier: "basic" | "pro") {
  return COURSE_CATEGORIES.filter((c) => c.tier === tier);
}
