import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Contacto | ProLevelCode",
  description: "Contacta con ProLevelCode para consultas sobre desarrollo web, cursos o colaboraciones.",
};

export default function ContactPage() {
  redirect("https://7uanf.com/#contact");
}
