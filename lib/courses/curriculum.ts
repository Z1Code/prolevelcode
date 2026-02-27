/**
 * Static curriculum structure.
 * Both the user dashboard and admin panel consume this to render cards.
 * `defaultSlug` is used to auto-create the course in the DB if it doesn't exist yet.
 */

export interface CurriculumResource {
  label: string;
  url: string;
  /** Hint shown below the link */
  hint?: string;
}

export interface CurriculumModuleData {
  /** Unique key for this module (used as React key and for matching DB courses) */
  key: string;
  title: string;
  description: string;
  /** The slug this module maps to in the Course table (null = not yet created) */
  defaultSlug: string;
  tier: "basic" | "pro";
  /** Icon identifier — rendered by the UI layer */
  icon: "academic" | "lock" | "code" | "badge" | "star" | "fire" | "cube" | "code-pro" | "badge-pro" | "terminal";
  /** Optional resources shown on the course page */
  resources?: CurriculumResource[];
}

export const BASIC_MODULES: CurriculumModuleData[] = [
  {
    key: "basic-intro",
    title: "Introducción",
    description: "Fundamentos, setup del entorno y primeros pasos en el desarrollo web",
    defaultSlug: "intro-al-curso",
    tier: "basic",
    icon: "academic",
  },
  {
    key: "basic-bdd-auth",
    title: "BDD + Auth + Seguridad",
    description: "Base de datos, autenticación de usuarios y buenas prácticas de seguridad",
    defaultSlug: "bdd-auth-seguridad",
    tier: "basic",
    icon: "lock",
  },
  {
    key: "basic-practicas",
    title: "Prácticas",
    description: "Construye varias aplicaciones reales paso a paso desde cero",
    defaultSlug: "practicas",
    tier: "basic",
    icon: "code",
  },
  {
    key: "basic-final",
    title: "Pasos finales",
    description: "Deploy, optimización, SEO y lanzamiento a producción",
    defaultSlug: "pasos-finales",
    tier: "basic",
    icon: "badge",
  },
];

export const PRO_MODULES: CurriculumModuleData[] = [
  {
    key: "pro-intro",
    title: "Introducción",
    description: "Arquitectura avanzada, patrones de diseño y setup profesional",
    defaultSlug: "pro-introduccion",
    tier: "pro",
    icon: "star",
  },
  {
    key: "pro-avanzado",
    title: "Avanzado",
    description: "Técnicas avanzadas, rendimiento y escalabilidad en producción",
    defaultSlug: "pro-avanzado",
    tier: "pro",
    icon: "fire",
  },
  {
    key: "pro-features",
    title: "Características profesionales",
    description: "Pagos, dashboards, analytics y features de apps SaaS reales",
    defaultSlug: "pro-caracteristicas",
    tier: "pro",
    icon: "cube",
  },
  {
    key: "pro-practicas",
    title: "Prácticas",
    description: "Proyectos profesionales completos con CI/CD y testing",
    defaultSlug: "pro-practicas",
    tier: "pro",
    icon: "code-pro",
  },
  {
    key: "pro-final",
    title: "Pasos finales",
    description: "Monetización, marketing técnico y estrategia de lanzamiento",
    defaultSlug: "pro-pasos-finales",
    tier: "pro",
    icon: "badge-pro",
  },
  {
    key: "pro-setup-claude",
    title: "Setup Claude",
    description: "Configura y domina Claude Code como tu copiloto de desarrollo con IA",
    defaultSlug: "setup-claude",
    tier: "pro",
    icon: "terminal",
    resources: [
      {
        label: "The Complete Guide to Building Skills for Claude",
        url: "https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf",
        hint: "Copia este enlace y pégalo en Claude Code para que lo incorpore a tu flujo de trabajo",
      },
    ],
  },
];

export const ALL_MODULES = [...BASIC_MODULES, ...PRO_MODULES];
