"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoriaForm } from "./categoria-form";

export function CategoriaCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva categoría
      </Button>
      <CategoriaForm open={open} onOpenChange={setOpen} />
    </>
  );
}
