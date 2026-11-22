"use client";

import { useEffect, useState } from "react";
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
import { actualizarCategoria, crearCategoria } from "@/lib/actions/categorias";
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
  const [nombre, setNombre] = useState("");
  const { ejecutarAccion, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    crearCategoriaSchema,
    categoria ? "Categoría actualizada." : "Categoría creada.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setNombre(categoria?.nombre ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoria]);

  // Sección 10.3: la mutación va por Server Action; el servicio es el mismo que usa la API.
  // La acción ya refresca la página en la misma respuesta, sin router.refresh().
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const data = await ejecutarAccion({ nombre }, (datos) =>
      categoria ? actualizarCategoria(categoria.id, datos) : crearCategoria(datos),
    );
    if (data) onOpenChange(false);
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
