"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsuarioForm } from "./usuario-form";

export function UsuarioCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo usuario
      </Button>
      <UsuarioForm open={open} onOpenChange={setOpen} />
    </>
  );
}
