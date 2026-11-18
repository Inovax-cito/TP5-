"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { actualizarUsuarioSchema, crearUsuarioSchema } from "@/lib/validations/usuarios";

type Usuario = { id: number; nombre: string; email: string; rol: "admin" | "vendedor"; activo: boolean };

export function UsuarioForm({
  open,
  onOpenChange,
  usuario,
  esMismoUsuario,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
  esMismoUsuario?: boolean;
}) {
  const router = useRouter();
  const esEdicion = Boolean(usuario);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "vendedor" as "admin" | "vendedor", password: "" });
  const { ejecutar, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    esEdicion ? actualizarUsuarioSchema : crearUsuarioSchema,
    esEdicion ? "Usuario actualizado." : "Usuario creado.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setForm(
      usuario
        ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, password: "" }
        : { nombre: "", email: "", rol: "vendedor", password: "" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const data = await ejecutar(
      esEdicion
        ? { nombre: form.nombre, email: form.email, rol: form.rol }
        : { nombre: form.nombre, email: form.email, rol: form.rol, password: form.password },
      esEdicion ? `/api/usuarios/${usuario!.id}` : "/api/usuarios",
      esEdicion ? "PATCH" : "POST",
    );
    if (data) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Cambiá nombre, email o rol. Usá “Restablecer contraseña” para una clave nueva."
              : "Se crea con una contraseña provisoria que deberá cambiar al ingresar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <Field label="Nombre" required error={errores.nombre}>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Email" required error={errores.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Rol" required error={errores.rol}>
            <Select value={form.rol} onValueChange={(value) => setForm({ ...form, rol: value as "admin" | "vendedor" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {!esEdicion && (
            <Field label="Contraseña provisoria" required error={errores.password} hint="Mínimo 8 caracteres.">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          )}
          {esMismoUsuario && (
            <Alert>No podés quitarte el rol de administrador ni desactivarte a vos mismo.</Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
