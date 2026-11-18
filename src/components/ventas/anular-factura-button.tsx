"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { apiFetch } from "@/lib/client/api";

export function AnularFacturaButton({ facturaId }: { facturaId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function anular(motivo: string) {
    setProcesando(true);
    try {
      await apiFetch(`/api/facturas/${facturaId}/anulacion`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      });
      toast.success("Factura anulada. El stock y el saldo fueron revertidos.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo anular la factura.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Ban className="h-4 w-4" /> Anular factura
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Anular factura"
        description="Se reingresará el stock y se revertirá el saldo del cliente. La factura quedará como Anulada."
        confirmLabel="Anular"
        loading={procesando}
        motivo
        onConfirm={anular}
      />
    </>
  );
}
