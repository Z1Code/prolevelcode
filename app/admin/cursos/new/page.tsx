import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NewCoursePage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Nuevo curso</h2>
      <Card className="mt-4 p-4">
        <form className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Titulo" />
          <Input placeholder="Slug" />
          <Input placeholder="Precio en centavos" />
          <Input placeholder="Moneda (USD)" />
          <div className="md:col-span-2">
            <Textarea placeholder="Descripcion" />
          </div>
          <div className="md:col-span-2">
            <Button type="button">Guardar curso</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
