import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

interface AdminLessonsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLessonsPage({ params }: AdminLessonsPageProps) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,youtube_video_id,sort_order,is_free_preview")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="text-2xl font-semibold">Lecciones del curso</h2>
      <Card className="mt-4 p-4">
        <ul className="space-y-2 text-sm">
          {lessons?.map((lesson) => (
            <li key={lesson.id} className="liquid-surface-soft p-3">
              <p className="font-medium">{lesson.title}</p>
              <p className="text-xs text-slate-400">YouTube ID: {lesson.youtube_video_id}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}


