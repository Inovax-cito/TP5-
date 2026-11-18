"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClienteForm } from "./cliente-form";

export function ClienteCreateButton({ label = "Nuevo cliente" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <ClienteForm open={open} onOpenChange={setOpen} />
    </>
  );
}
