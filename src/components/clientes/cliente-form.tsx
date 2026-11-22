"use client";

import { useEffect, useState } from "react";
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
import { MoneyInput } from "@/components/common/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { actualizarCliente, crearCliente } from "@/lib/actions/clientes";
import { crearClienteSchema } from "@/lib/validations/clientes";

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
  saldo?: number;
  disponible?: number | null;
};

const inicial = {
  tipoDoc: "DNI" as "DNI" | "CUIT",
  nroDoc: "",
  nombre: "",
  domicilio: "",
  telefono: "",
  email: "",
  cuentaCorriente: false,
  limiteCredito: 0,
};

export function ClienteForm({
  open,
  onOpenChange,
  cliente,
  alCrear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  alCrear?: (cliente: Cliente) => void;
}) {
  const esEdicion = Boolean(cliente);
  const [form, setForm] = useState(inicial);
  const { ejecutarAccion, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    crearClienteSchema,
    esEdicion ? "Cliente actualizado." : "Cliente creado.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setForm(
      cliente
        ? {
            tipoDoc: cliente.tipoDoc,
            nroDoc: cliente.nroDoc,
            nombre: cliente.nombre,
            domicilio: cliente.domicilio ?? "",
            telefono: cliente.telefono ?? "",
            email: cliente.email ?? "",
            cuentaCorriente: cliente.cuentaCorriente,
            limiteCredito: cliente.limiteCredito ?? 0,
          }
        : inicial,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente]);

  // Sección 10.3: la mutación va por Server Action; el servicio es el mismo que usa la API.
  // También cubre el alta rápida desde la nueva venta (RF-V2): la confirmación de la venta
  // y la búsqueda en vivo siguen usando la API REST.
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const valores = {
      ...form,
      limiteCredito: form.cuentaCorriente && form.limiteCredito > 0 ? form.limiteCredito : null,
    };
    const data = await ejecutarAccion<Cliente>(
      valores,
      (datos) => (cliente ? actualizarCliente(cliente.id, datos) : crearCliente(datos)),
      { alTerminar: alCrear },
    );
    if (data) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>Datos de identificación y cuenta corriente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de documento" required error={errores.tipoDoc}>
              <Select
                value={form.tipoDoc}
                onValueChange={(value) => setForm({ ...form, tipoDoc: value as "DNI" | "CUIT" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CUIT">CUIT</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Número de documento" required error={errores.nroDoc}>
              <Input
                value={form.nroDoc}
                onChange={(e) => setForm({ ...form, nroDoc: e.target.value })}
                placeholder={form.tipoDoc === "DNI" ? "28.456.123" : "30-12345678-9"}
              />
            </Field>
          </div>
          <Field label="Nombre o razón social" required error={errores.nombre}>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Domicilio" error={errores.domicilio}>
            <Input value={form.domicilio} onChange={(e) => setForm({ ...form, domicilio: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" error={errores.telefono}>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <Field label="Email" error={errores.email}>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={form.cuentaCorriente}
              onChange={(e) => setForm({ ...form, cuentaCorriente: e.target.checked })}
            />
            Habilitado para cuenta corriente
          </label>
          {form.cuentaCorriente && (
            <Field label="Límite de crédito" error={errores.limiteCredito} hint="Opcional. 0 significa sin límite.">
              <MoneyInput value={form.limiteCredito} onChange={(limiteCredito) => setForm({ ...form, limiteCredito })} />
            </Field>
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
