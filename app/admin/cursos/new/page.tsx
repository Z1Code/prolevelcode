import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/course-form";
import { createCourse } from "../../actions";

export default function NewCoursePage() {
  return (
    <div>
      <Link href="/admin/cursos" className="mb-3 inline-flex text-xs text-slate-400 hover:text-slate-200">← Volver a cursos</Link>
      <h2 className="text-2xl font-semibold">Nuevo curso</h2>
      <Card className="mt-4 p-4">
        <CourseForm action={createCourse} submitLabel="Crear curso" />
      </Card>
    </div>
  );
}
