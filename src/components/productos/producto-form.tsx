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
import { ProductImage } from "@/components/productos/product-image";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/common/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { crearProductoSchema } from "@/lib/validations/productos";

type Producto = {
  id: number;
  codigo: string;
  descripcion: string;
  imagen?: string | null;
  categoria: { id: number };
  precio: number;
  stockMinimo: number;
};

type Categoria = { id: number; nombre: string };

export function ProductoForm({
  open,
  onOpenChange,
  categorias,
  producto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: Categoria[];
  producto?: Producto | null;
}) {
  const router = useRouter();
  const esEdicion = Boolean(producto);
  const [form, setForm] = useState({
    codigo: "",
    descripcion: "",
    imagen: "",
    categoriaId: 0,
    precio: 0,
    stockMinimo: 0,
    stockInicial: 0,
  });
  const { ejecutar, errores, errorGeneral, cargando, limpiar } = useApiMutation(
    crearProductoSchema,
    esEdicion ? "Producto actualizado." : "Producto creado.",
  );

  useEffect(() => {
    if (!open) return;
    limpiar();
    setForm(
      producto
        ? {
            codigo: producto.codigo,
            descripcion: producto.descripcion,
            imagen: producto.imagen ?? "",
            categoriaId: producto.categoria.id,
            precio: producto.precio,
            stockMinimo: producto.stockMinimo,
            stockInicial: 0,
          }
        : { codigo: "", descripcion: "", imagen: "", categoriaId: categorias[0]?.id ?? 0, precio: 0, stockMinimo: 0, stockInicial: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, producto]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const valores = esEdicion
      ? {
          codigo: form.codigo,
          descripcion: form.descripcion,
          imagen: form.imagen,
          categoriaId: form.categoriaId,
          precio: form.precio,
          stockMinimo: form.stockMinimo,
        }
      : form;
    const url = esEdicion ? `/api/productos/${producto!.id}` : "/api/productos";
    const data = await ejecutar(valores, url, esEdicion ? "PATCH" : "POST");
    if (data) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            La existencia nunca se edita a mano: se registra como un movimiento de stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código" required error={errores.codigo}>
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="HE-001"
              />
            </Field>
            <Field label="Categoría" required error={errores.categoriaId}>
              <Select
                value={form.categoriaId ? String(form.categoriaId) : undefined}
                onValueChange={(value) => setForm({ ...form, categoriaId: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={String(categoria.id)}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="Imagen (opcional)"
            error={errores.imagen}
            hint="URL http(s) o ruta local. Se muestra chica en el catálogo y en las categorías."
          >
            <div className="flex items-start gap-3">
              <ProductImage src={form.imagen || null} alt="Vista previa del producto" className="h-12 w-12" />
              <Input
                className="min-w-0 flex-1"
                value={form.imagen}
                onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                placeholder="/productos/HE-001.svg o https://…"
              />
            </div>
          </Field>
          <Field label="Descripción" required error={errores.descripcion}>
            <Input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Martillo carpintero 500 g"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio de venta" required error={errores.precio}>
              <MoneyInput value={form.precio} onChange={(precio) => setForm({ ...form, precio })} />
            </Field>
            <Field label="Stock mínimo" required error={errores.stockMinimo}>
              <Input
                type="number"
                min={0}
                value={form.stockMinimo || ""}
                onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
              />
            </Field>
          </div>
          {!esEdicion && (
            <Field label="Stock inicial" error={errores.stockInicial} hint="Opcional: se carga como un ingreso.">
              <Input
                type="number"
                min={0}
                value={form.stockInicial || ""}
                onChange={(e) => setForm({ ...form, stockInicial: Number(e.target.value) })}
              />
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
