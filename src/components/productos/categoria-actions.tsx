"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CategoriaForm } from "./categoria-form";
import { apiFetch } from "@/lib/client/api";

export function CategoriaActions({ categoria }: { categoria: { id: number; nombre: string; activa: boolean } }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function desactivar() {
    setProcesando(true);
    try {
      await apiFetch(`/api/categorias/${categoria.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activa: false }),
      });
      toast.success("Categoría desactivada.");
      setConfirmando(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditando(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Desactivar" onClick={() => setConfirmando(true)}>
        <Power className="h-4 w-4" />
      </Button>
      <CategoriaForm open={editando} onOpenChange={setEditando} categoria={categoria} />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="Desactivar categoría"
        description="No se puede desactivar una categoría con productos activos."
        confirmLabel="Desactivar"
        loading={procesando}
        onConfirm={() => desactivar()}
      />
    </div>
  );
}
