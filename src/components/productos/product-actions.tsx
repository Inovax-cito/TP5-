"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProductoForm } from "./producto-form";
import { apiFetch } from "@/lib/client/api";

type Producto = {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: { id: number };
  precio: number;
  stockMinimo: number;
  activo: boolean;
};

type Categoria = { id: number; nombre: string };

export function ProductActions({
  producto,
  categorias,
}: {
  producto: Producto;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function darDeBaja() {
    setProcesando(true);
    try {
      await apiFetch(`/api/productos/${producto.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: false }),
      });
      toast.success("Producto dado de baja.");
      setConfirmando(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo dar de baja.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="icon" title="Ver ficha">
        <Link href={`/productos/${producto.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditando(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      {producto.activo && (
        <Button variant="ghost" size="icon" title="Dar de baja" onClick={() => setConfirmando(true)}>
          <Power className="h-4 w-4" />
        </Button>
      )}

      <ProductoForm
        open={editando}
        onOpenChange={setEditando}
        categorias={categorias}
        producto={producto}
      />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="Dar de baja el producto"
        description={`${producto.codigo} dejará de ofrecerse en ventas. Su historial se conserva.`}
        confirmLabel="Dar de baja"
        loading={procesando}
        onConfirm={() => darDeBaja()}
      />
    </div>
  );
}
