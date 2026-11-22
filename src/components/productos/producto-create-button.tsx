"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductoForm } from "./producto-form";

export function ProductoCreateButton({ categorias }: { categorias: Array<{ id: number; nombre: string }> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo producto
      </Button>
      <ProductoForm open={open} onOpenChange={setOpen} categorias={categorias} />
    </>
  );
}
