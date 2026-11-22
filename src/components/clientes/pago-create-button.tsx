"use client";

import { useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PagoForm } from "./pago-form";

export function PagoCreateButton({
  cliente,
  variant = "default",
}: {
  cliente: { id: number; nombre: string; saldo: number; cuentaCorriente: boolean };
  variant?: "default" | "outline" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} disabled={!cliente.cuentaCorriente || cliente.saldo <= 0}>
        <BadgeDollarSign className="h-4 w-4" /> Registrar pago
      </Button>
      <PagoForm open={open} onOpenChange={setOpen} cliente={cliente} />
    </>
  );
}
