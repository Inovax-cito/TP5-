"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ClienteForm } from "./cliente-form";
import { apiFetch } from "@/lib/client/api";

type Cliente = {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  saldo: number;
  activo: boolean;
};

export function ClienteActions({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function darDeBaja() {
    setProcesando(true);
    try {
      await apiFetch(`/api/clientes/${cliente.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: false }),
      });
      toast.success("Cliente dado de baja.");
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
        <Link href={`/clientes/${cliente.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditando(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      {cliente.activo && (
        <Button variant="ghost" size="icon" title="Dar de baja" onClick={() => setConfirmando(true)}>
          <Power className="h-4 w-4" />
        </Button>
      )}
      <ClienteForm open={editando} onOpenChange={setEditando} cliente={cliente} />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="Dar de baja el cliente"
        description={
          cliente.saldo > 0
            ? "El cliente tiene saldo pendiente. Regularizalo antes de darlo de baja."
            : "El cliente dejará de estar disponible para nuevas ventas."
        }
        confirmLabel="Dar de baja"
        loading={procesando}
        onConfirm={() => darDeBaja()}
      />
    </div>
  );
}
