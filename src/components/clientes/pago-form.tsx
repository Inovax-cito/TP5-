"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { MoneyInput } from "@/components/common/money-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { formatMoney } from "@/lib/format";
import { registrarPagoSchema } from "@/lib/validations/clientes";

type Cliente = { id: number; nombre: string; saldo: number; cuentaCorriente: boolean };
type Recibo = { id: number; numeroRecibo: string; saldoCliente: number };

export function PagoForm({
  open,
  onOpenChange,
  cliente,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ importe: 0, medio: "efectivo", observacion: "" });
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const { ejecutar, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    registrarPagoSchema,
    "Pago registrado.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setRecibo(null);
    setForm({ importe: cliente.saldo > 0 ? cliente.saldo : 0, medio: "efectivo", observacion: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente.id]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const data = await ejecutar<Recibo>(form, `/api/clientes/${cliente.id}/pagos`);
    if (data) {
      setRecibo(data);
      router.refresh();
    }
  }

  if (recibo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pago registrado</DialogTitle>
            <DialogDescription>Recibo {recibo.numeroRecibo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p>
              Cliente: <strong>{cliente.nombre}</strong>
            </p>
            <p>
              Nuevo saldo: <strong className="tabular">{formatMoney(recibo.saldoCliente)}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link href={`/pagos/${recibo.id}`} target="_blank">
                Ver recibo
              </Link>
            </Button>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {cliente.nombre} · Saldo actual: <strong>{formatMoney(cliente.saldo)}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <Field label="Importe" required error={errores.importe}>
            <MoneyInput value={form.importe} onChange={(importe) => setForm({ ...form, importe })} />
          </Field>
          <Field label="Medio" required error={errores.medio}>
            <Select value={form.medio} onValueChange={(medio) => setForm({ ...form, medio })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta_debito">Tarjeta de débito</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Observación" error={errores.observacion}>
            <Input
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              placeholder="Detalle opcional"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando || cliente.saldo <= 0}>
              {cargando ? "Registrando…" : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
