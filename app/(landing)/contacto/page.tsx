"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Enviando...");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      serviceInterest: formData.get("serviceInterest"),
      budgetRange: formData.get("budgetRange"),
      message: formData.get("message"),
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setStatus(response.ok ? "Mensaje enviado. Te respondere pronto." : "No se pudo enviar. Intenta de nuevo.");

    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <main className="container-wide section-spacing liquid-section">
      <h1 className="text-4xl font-bold md:text-6xl">Contacto</h1>
      <p className="mt-4 max-w-2xl text-slate-300">Cuentame tu idea. Si encaja, coordinamos kickoff y arrancamos.</p>

      <form onSubmit={handleSubmit} className="liquid-form-shell mt-8 grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Nombre</label>
          <Input name="name" required />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Email</label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Empresa</label>
          <Input name="company" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Servicio de interes</label>
          <Input name="serviceInterest" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Rango de presupuesto</label>
          <Input name="budgetRange" placeholder="$2k - $5k" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm text-slate-300">Mensaje</label>
          <Textarea name="message" required />
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Enviar mensaje</Button>
          {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
        </div>
      </form>
    </main>
  );
}


