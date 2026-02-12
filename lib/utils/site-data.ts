export const navLinks = [
  { href: "/servicios", label: "Servicios" },
  {
    label: "Aprender",
    children: [
      { href: "/guias", label: "Guias" },
      { href: "/cursos", label: "Cursos" },
    ],
  },
  { href: "/becas", label: "Becas" },
  { href: "/sobre-mi", label: "Sobre mi" },
  { href: "/contacto", label: "Contacto" },
];

export const defaultServices = [
  {
    title: "Web Apps Full-Stack",
    description: "Arquitecturas robustas con Next.js, TypeScript, APIs y despliegue en la nube.",
    price: "Desde $2,000",
    icon: "code",
    slug: "web-apps",
  },
  {
    title: "AI Solutions",
    description: "Asistentes, agentes y automatizaciones con LLMs y flujos RAG orientados a negocio.",
    price: "Desde $3,000",
    icon: "bot",
    slug: "ai-solutions",
  },
  {
    title: "UI/UX Design",
    description: "Interfaces premium orientadas a conversion y experiencia de usuario memorable.",
    price: "Desde $1,500",
    icon: "sparkles",
    slug: "ui-ux",
  },
  {
    title: "Dashboards & Analytics",
    description: "Paneles en tiempo real para producto, ventas y operaciones.",
    price: "Desde $1,500",
    icon: "chart",
    slug: "dashboards",
  },
  {
    title: "APIs & Integraciones",
    description: "Integracion con MercadoPago, PostgreSQL, CRMs y servicios externos.",
    price: "Desde $2,000",
    icon: "plug",
    slug: "apis",
  },
  {
    title: "Consultoria Tecnica",
    description: "Acompanamiento senior en arquitectura, performance y seguridad.",
    price: "$150/hora",
    icon: "wrench",
    slug: "consultoria",
  },
];

export const featuredCourses = [
  {
    slug: "nextjs-14-ai-fullstack-masterclass",
    title: "Next.js + AI Full-Stack Masterclass",
    subtitle: "Construye un SaaS con IA de principio a fin",
    students: 147,
    rating: 4.9,
    modules: 12,
    lessons: 48,
    duration: "24 horas",
    price: "$49.99",
    tags: ["nextjs", "ai", "fullstack"],
  },
  {
    slug: "agentes-ia-produccion",
    title: "Agentes de IA en Produccion",
    subtitle: "Disena agentes robustos para operaciones reales",
    students: 89,
    rating: 4.8,
    modules: 8,
    lessons: 33,
    duration: "16 horas",
    price: "$69.99",
    tags: ["agents", "rag", "llm"],
  },
  {
    slug: "arquitectura-saas-2026",
    title: "Arquitectura SaaS 2026",
    subtitle: "Escala tu producto desde MVP hasta miles de usuarios",
    students: 212,
    rating: 4.9,
    modules: 14,
    lessons: 57,
    duration: "28 horas",
    price: "$79.99",
    tags: ["saas", "scaling", "payments"],
  },
];

export const testimonials = [
  {
    name: "Laura M.",
    role: "CEO, TechCorp",
    content: "Pasamos de una idea a un producto real en 6 semanas. La calidad tecnica fue impecable.",
  },
  {
    name: "Diego R.",
    role: "Founder, SaaSify",
    content: "El curso fue directo al grano y aplicable desde el dia uno. Excelente nivel.",
  },
  {
    name: "Ana P.",
    role: "Product Lead",
    content: "La combinacion de diseno y performance nos subio conversion y retencion.",
  },
];
