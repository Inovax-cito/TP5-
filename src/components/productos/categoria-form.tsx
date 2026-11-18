"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { crearCategoriaSchema } from "@/lib/validations/categorias";

type Categoria = { id: number; nombre: string; activa: boolean };

export function CategoriaForm({
  open,
  onOpenChange,
  categoria,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: Categoria | null;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const { ejecutar, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    crearCategoriaSchema,
    categoria ? "Categoría actualizada." : "Categoría creada.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setNombre(categoria?.nombre ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoria]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const data = await ejecutar(
      { nombre },
      categoria ? `/api/categorias/${categoria.id}` : "/api/categorias",
      categoria ? "PATCH" : "POST",
    );
    if (data) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          <DialogDescription>Usá nombres breves y claros para el catálogo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <Field label="Nombre" required error={errores.nombre}>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Herramientas" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
