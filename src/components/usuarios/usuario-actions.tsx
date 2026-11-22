"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Power, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { UsuarioForm } from "./usuario-form";
import { apiFetch, mapApiErrors } from "@/lib/client/api";

type Usuario = { id: number; nombre: string; email: string; rol: "admin" | "vendedor"; activo: boolean };

export function UsuarioActions({
  usuario,
  esMismoUsuario,
}: {
  usuario: Usuario;
  esMismoUsuario: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [nuevaClave, setNuevaClave] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function alternarEstado() {
    setProcesando(true);
    try {
      await apiFetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !usuario.activo }),
      });
      toast.success(usuario.activo ? "Usuario desactivado." : "Usuario reactivado.");
      setConfirmando(false);
      router.refresh();
    } catch (error) {
      const { mensaje } = mapApiErrors(error);
      toast.error(mensaje ?? "No se pudo cambiar el estado.");
    } finally {
      setProcesando(false);
    }
  }

  async function restablecer() {
    setProcesando(true);
    try {
      const data = await apiFetch<{ passwordTemporal: string }>(`/api/usuarios/${usuario.id}/reset-password`, {
        method: "POST",
      });
      setNuevaClave(data.passwordTemporal);
      router.refresh();
    } catch (error) {
      const { mensaje } = mapApiErrors(error);
      toast.error(mensaje ?? "No se pudo restablecer la contraseña.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditando(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Restablecer contraseña" onClick={restablecer} disabled={procesando}>
        <RotateCcw className="h-4 w-4" />
      </Button>
      {!esMismoUsuario && (
        <Button variant="ghost" size="icon" title={usuario.activo ? "Desactivar" : "Reactivar"} onClick={() => setConfirmando(true)}>
          <Power className="h-4 w-4" />
        </Button>
      )}

      <UsuarioForm open={editando} onOpenChange={setEditando} usuario={usuario} esMismoUsuario={esMismoUsuario} />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={usuario.activo ? "Desactivar usuario" : "Reactivar usuario"}
        description={
          usuario.activo
            ? "El usuario perderá el acceso de inmediato, incluso con una sesión abierta."
            : "El usuario podrá volver a iniciar sesión."
        }
        confirmLabel={usuario.activo ? "Desactivar" : "Reactivar"}
        loading={procesando}
        onConfirm={() => alternarEstado()}
      />
      <Dialog open={nuevaClave !== null} onOpenChange={(open) => !open && setNuevaClave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Contraseña restablecida
            </DialogTitle>
            <DialogDescription>Compartí esta contraseña con el usuario. No volverá a mostrarse.</DialogDescription>
          </DialogHeader>
          <Alert className="break-all text-base font-mono font-bold">{nuevaClave}</Alert>
          <DialogFooter>
            <Button onClick={() => setNuevaClave(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
