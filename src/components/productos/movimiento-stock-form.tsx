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
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { movimientoStockSchema } from "@/lib/validations/productos";

const MOTIVOS = {
  ingreso: ["Reposición", "Stock inicial", "Devolución de cliente"],
  egreso: ["Rotura", "Vencimiento", "Ajuste de inventario", "Uso interno"],
} as const;

export function MovimientoStockForm({
  open,
  onOpenChange,
  producto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: { id: number; codigo: string; descripcion: string; existencia: number };
}) {
  const router = useRouter();
  const [form, setForm] = useState<{
    tipo: "ingreso" | "egreso";
    cantidad: number;
    motivo: string;
    observacion: string;
  }>({ tipo: "ingreso", cantidad: 0, motivo: "Reposición", observacion: "" });
  const { ejecutar, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    movimientoStockSchema,
    "Movimiento registrado.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setForm({ tipo: "ingreso", cantidad: 0, motivo: "Reposición", observacion: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const data = await ejecutar(form, `/api/productos/${producto.id}/movimientos`);
    if (data) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingreso / egreso de stock</DialogTitle>
          <DialogDescription>
            {producto.codigo} · {producto.descripcion}. Existencia actual: <strong>{producto.existencia}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" required error={errores.tipo}>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm({ ...form, tipo: value as "ingreso" | "egreso", motivo: MOTIVOS[value as "ingreso"][0] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cantidad" required error={errores.cantidad}>
              <Input
                type="number"
                min={1}
                value={form.cantidad || ""}
                onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Motivo" required error={errores.motivo}>
            <Select value={form.motivo} onValueChange={(value) => setForm({ ...form, motivo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS[form.tipo].map((motivo) => (
                  <SelectItem key={motivo} value={motivo}>
                    {motivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Observación" error={errores.observacion}>
            <Textarea
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              placeholder="Detalle opcional"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" variant={form.tipo === "egreso" ? "destructive" : "default"} disabled={cargando}>
              {cargando ? "Guardando…" : "Registrar movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
