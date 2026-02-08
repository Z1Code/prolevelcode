import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import { getResendClient } from "@/lib/email/resend";
import { contactNotificationTemplate } from "@/lib/email/templates";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      service_interest: parsed.data.serviceInterest,
      budget_range: parsed.data.budgetRange,
      message: parsed.data.message,
    },
  });

  if (env.resendApiKey && env.adminEmails.length > 0) {
    const resend = getResendClient();
    const template = contactNotificationTemplate({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });

    await resend.emails.send({
      from: "ProLevelCode <no-reply@prolevelcode.dev>",
      to: env.adminEmails,
      subject: template.subject,
      html: template.html,
    });
  }

  return NextResponse.json({ ok: true, id: message.id }, { status: 201 });
}
