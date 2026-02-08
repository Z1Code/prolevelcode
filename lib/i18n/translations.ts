export const translations = {
  es: {
    nav: {
      services: "Servicios",
      courses: "Cursos",
      about: "Sobre mi",
      contact: "Contacto",
      login: "Login",
      hire: "Contratar",
    },
    hero: {
      badge1: "Disponible para proyectos Q1 2026",
      badge2: "Full-Stack & IA",
      heading: "Aprende desarrollo web IA con estándares",
      headingHighlight: "de talla mundial",
      subtitle: "Construyo experiencias digitales premium",
      cta1: "Ver Servicios",
      cta2: "Explorar Cursos",
      students: "estudiantes",
      satisfied: "satisfechos",
    },
    showcase: {
      line1Prefix: "Programa",
      line1Accent: "web/móvil",
      line2: "a nivel profesional.",
    },
  },
  en: {
    nav: {
      services: "Services",
      courses: "Courses",
      about: "About me",
      contact: "Contact",
      login: "Login",
      hire: "Hire me",
    },
    hero: {
      badge1: "Available for Q1 2026 projects",
      badge2: "Full-Stack & AI",
      heading: "Learn web development & AI with",
      headingHighlight: "world-class standards",
      subtitle: "I build premium digital experiences",
      cta1: "View Services",
      cta2: "Explore Courses",
      students: "students",
      satisfied: "satisfied",
    },
    showcase: {
      line1Prefix: "Build",
      line1Accent: "web/mobile",
      line2: "at a professional level.",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type Translations = (typeof translations)[Language];
