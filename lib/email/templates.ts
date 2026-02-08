interface EmailTemplateProps {
  name?: string;
  courseTitle?: string;
  dashboardUrl?: string;
  resetUrl?: string;
}

export function welcomeTemplate({ name }: EmailTemplateProps) {
  return {
    subject: "Bienvenido a la plataforma",
    html: `<h1>Hola ${name ?? ""}</h1><p>Tu cuenta está lista. Ya puedes comprar cursos y acceder a tu dashboard.</p>`,
  };
}

export function coursePurchaseTemplate({ courseTitle, dashboardUrl }: EmailTemplateProps) {
  return {
    subject: "Compra confirmada",
    html: `<h1>Compra confirmada</h1><p>Tu curso <strong>${courseTitle ?? ""}</strong> está disponible.</p><p><a href="${dashboardUrl}">Ir al dashboard</a></p>`,
  };
}

export function courseAccessTemplate({ courseTitle, dashboardUrl }: EmailTemplateProps) {
  return {
    subject: "Acceso activado",
    html: `<p>Ya puedes acceder a <strong>${courseTitle ?? ""}</strong>.</p><p><a href="${dashboardUrl}">Abrir curso</a></p>`,
  };
}

export function tokenExpiredTemplate({ dashboardUrl }: EmailTemplateProps) {
  return {
    subject: "Tu token de video expiró",
    html: `<p>Tu sesión de video expiró. Genera un nuevo token desde el curso.</p><p><a href="${dashboardUrl}">Ir al dashboard</a></p>`,
  };
}

export function resetPasswordTemplate({ resetUrl }: EmailTemplateProps) {
  return {
    subject: "Recupera tu cuenta",
    html: `<p>Haz clic para recuperar tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  };
}

export function contactNotificationTemplate(input: { name: string; email: string; message: string }) {
  return {
    subject: `Nuevo mensaje de contacto: ${input.name}`,
    html: `<p><strong>${input.name}</strong> (${input.email})</p><p>${input.message}</p>`,
  };
}


