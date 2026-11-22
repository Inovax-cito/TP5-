"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovimientoStockForm } from "./movimiento-stock-form";

export function MovimientoCreateButton({
  producto,
}: {
  producto: { id: number; codigo: string; descripcion: string; existencia: number };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <ArrowLeftRight className="h-4 w-4" /> Ingreso / egreso
      </Button>
      <MovimientoStockForm open={open} onOpenChange={setOpen} producto={producto} />
    </>
  );
}
