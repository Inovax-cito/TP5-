"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Minus, Plus, Search, ShoppingCart, Trash2, UserPlus, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/common/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { formatMoney } from "@/lib/format";
import { emitirFacturaSchema } from "@/lib/validations/facturas";

export type ProductoVenta = {
  id: number;
  codigo: string;
  descripcion: string;
  precio: number;
  existencia: number;
  categoria: { nombre: string };
};

export type ClienteVenta = {
  id: number;
  nombre: string;
  tipoDoc: string;
  nroDoc: string;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  saldo: number;
  disponible: number | null;
};

type Item = ProductoVenta & { cantidad: number; productoId: number };
type Forma = "contado" | "tarjeta" | "cuenta_corriente";

type FacturaCreada = { id: number; numeroFormateado: string; total: number };

export function NuevaVentaForm({
  productos,
  clientesIniciales,
  proximoNumero,
}: {
  productos: ProductoVenta[];
  clientesIniciales: ClienteVenta[];
  proximoNumero: string;
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaProducto, setBuscaProducto] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [forma, setForma] = useState<Forma>("contado");
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [tarjeta, setTarjeta] = useState({ tipo: "debito", marca: "Visa", ultimos4: "" });
  const [clienteDialog, setClienteDialog] = useState(false);

  const { ejecutar, errores, errorGeneral, cargando } = useApiMutation(
    emitirFacturaSchema,
    "Factura emitida correctamente.",
  );

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const total = useMemo(() => items.reduce((acc, item) => acc + item.precio * item.cantidad, 0), [items]);
  const vuelto = montoRecibido > 0 ? montoRecibido - total : 0;

  const productosFiltrados = useMemo(() => {
    const termino = buscaProducto.trim().toLowerCase();
    return productos
      .filter((p) => p.existencia > 0 && (!termino || p.codigo.toLowerCase().includes(termino) || p.descripcion.toLowerCase().includes(termino)))
      .slice(0, 8);
  }, [buscaProducto, productos]);

  const clientesFiltrados = useMemo(() => {
    const termino = buscaCliente.trim().toLowerCase();
    return clientes
      .filter((c) => !termino || c.nombre.toLowerCase().includes(termino) || c.nroDoc.replace(/[.\-\s]/g, "").includes(termino.replace(/[.\-\s]/g, "")))
      .slice(0, 6);
  }, [buscaCliente, clientes]);

  function agregarProducto(producto: ProductoVenta) {
    setItems((actuales) => {
      const existente = actuales.find((i) => i.productoId === producto.id);
      if (existente) {
        if (existente.cantidad + 1 > producto.existencia) {
          toast.error(`No hay más stock de ${producto.codigo}. Disponible: ${producto.existencia}.`);
          return actuales;
        }
        return actuales.map((i) => (i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...actuales, { ...producto, productoId: producto.id, cantidad: 1 }];
    });
    setBuscaProducto("");
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    setItems((actuales) =>
      actuales.map((item) => {
        if (item.productoId !== productoId) return item;
        const valor = Math.max(1, Math.min(cantidad || 1, item.existencia));
        if (cantidad > item.existencia) toast.error(`Stock disponible: ${item.existencia}.`);
        return { ...item, cantidad: valor };
      }),
    );
  }

  async function confirmar() {
    if (items.length === 0) {
      toast.error("Agregá al menos un producto.");
      return;
    }
    if (forma === "cuenta_corriente" && (!cliente || !cliente.cuentaCorriente)) {
      toast.error("Para vender a cuenta se necesita un cliente con cuenta corriente habilitada.");
      return;
    }
    if (forma === "cuenta_corriente" && cliente?.limiteCredito !== null && cliente) {
      if (cliente.saldo + total > cliente.limiteCredito!) {
        toast.error("La venta supera el límite de crédito del cliente.");
        return;
      }
    }
    if (forma === "contado" && montoRecibido > 0 && montoRecibido < total) {
      toast.error("El monto recibido no cubre el total.");
      return;
    }

    const pago =
      forma === "contado"
        ? { forma: "contado" as const, ...(montoRecibido > 0 ? { montoRecibido } : {}) }
        : forma === "tarjeta"
          ? { forma: "tarjeta" as const, tarjeta }
          : { forma: "cuenta_corriente" as const };

    const factura = await ejecutar<FacturaCreada>(
      {
        clienteId,
        items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
        pago,
      },
      "/api/facturas",
    );
    if (factura) router.push(`/ventas/${factura.id}`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" /> 1. Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={clienteId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setClienteId(null)}
              >
                Consumidor final
              </Button>
              {cliente && (
                <Badge variant="secondary" className="text-sm">
                  {cliente.nombre}
                </Badge>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setClienteDialog(true)}>
                <UserPlus className="h-4 w-4" /> Dar de alta
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar cliente por nombre o documento…"
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
              />
            </div>
            {buscaCliente && (
              <div className="grid gap-2 sm:grid-cols-2">
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClienteId(c.id);
                      setBuscaCliente("");
                    }}
                    className="rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
                  >
                    <span className="block font-medium">{c.nombre}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.tipoDoc} {c.nroDoc} {c.cuentaCorriente ? "· Cuenta corriente" : ""}
                    </span>
                  </button>
                ))}
                {clientesFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">No se encontró ese cliente.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" /> 2. Ítems
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar producto por código o descripción… (Enter para agregar)"
                value={buscaProducto}
                onChange={(e) => setBuscaProducto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && productosFiltrados[0]) {
                    e.preventDefault();
                    agregarProducto(productosFiltrados[0]);
                  }
                }}
              />
            </div>
            {buscaProducto && (
              <div className="grid gap-2 sm:grid-cols-2">
                {productosFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => agregarProducto(producto)}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
                  >
                    <span>
                      <span className="block font-medium">{producto.descripcion}</span>
                      <span className="block text-xs text-muted-foreground">
                        {producto.codigo} · {producto.existencia} disponibles
                      </span>
                    </span>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay productos con existencia para ese texto.</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Todavía no agregaste productos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productoId}>
                      <TableCell>
                        <p className="font-medium">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{item.codigo} · {item.existencia} disponibles</p>
                      </TableCell>
                      <TableCell>
                        <div className="mx-auto flex w-28 items-center gap-1">
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={item.existencia}
                            value={item.cantidad}
                            onChange={(e) => cambiarCantidad(item.productoId, Number(e.target.value))}
                            className="h-8 px-2 text-center"
                          />
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="tabular text-right text-sm">{formatMoney(item.precio)}</TableCell>
                      <TableCell className="tabular text-right font-semibold">{formatMoney(item.precio * item.cantidad)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setItems((actuales) => actuales.filter((i) => i.productoId !== item.productoId))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {errores.items && <p className="text-sm font-medium text-destructive">{errores.items}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> 3. Forma de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={forma} onValueChange={(value) => setForma(value as Forma)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contado">Contado</TabsTrigger>
                <TabsTrigger value="tarjeta">Tarjeta</TabsTrigger>
                <TabsTrigger value="cuenta_corriente" disabled={!cliente?.cuentaCorriente}>
                  Cuenta corriente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contado" className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="monto-recibido">Monto recibido</Label>
                    <MoneyInput id="monto-recibido" value={montoRecibido} onChange={setMontoRecibido} />
                    {errores["pago.montoRecibido"] && (
                      <p className="text-xs text-destructive">{errores["pago.montoRecibido"]}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Vuelto</p>
                    <p className={`tabular text-xl font-bold ${vuelto < 0 ? "text-destructive" : "text-success"}`}>
                      {formatMoney(vuelto)}
                    </p>
                    <p className="text-xs text-muted-foreground">Si se deja vacío se toma el total.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tarjeta" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={tarjeta.tipo} onValueChange={(value) => setTarjeta({ ...tarjeta, tipo: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Marca</Label>
                    <Select value={tarjeta.marca} onValueChange={(value) => setTarjeta({ ...tarjeta, marca: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visa">Visa</SelectItem>
                        <SelectItem value="Mastercard">Mastercard</SelectItem>
                        <SelectItem value="American Express">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ultimos4">Últimos 4 dígitos</Label>
                    <Input
                      id="ultimos4"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      value={tarjeta.ultimos4}
                      onChange={(e) => setTarjeta({ ...tarjeta, ultimos4: e.target.value.replace(/\D/g, "") })}
                    />
                    {errores["pago.tarjeta.ultimos4"] && (
                      <p className="text-xs text-destructive">{errores["pago.tarjeta.ultimos4"]}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Nunca ingreses el número completo de la tarjeta.</p>
              </TabsContent>

              <TabsContent value="cuenta_corriente">
                {cliente ? (
                  <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
                    <p><strong>{cliente.nombre}</strong></p>
                    <p>Saldo actual: <span className="tabular font-semibold">{formatMoney(cliente.saldo)}</span></p>
                    <p>
                      Disponible:{" "}
                      <span className="tabular font-semibold">
                        {cliente.disponible === null ? "Sin límite" : formatMoney(cliente.disponible)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">El nuevo saldo se registrará al confirmar la factura.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Seleccioná un cliente con cuenta corriente habilitada.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
      </div>

      <Card className="h-fit xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comprador</span>
            <span className="font-medium">{cliente?.nombre ?? "Consumidor final"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Productos</span>
            <span className="font-medium">{items.reduce((acc, i) => acc + i.cantidad, 0)} unidades</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Punto de venta</span>
            <span className="font-mono text-xs">{proximoNumero}</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-end justify-between">
              <span className="font-semibold">Total</span>
              <span className="tabular text-3xl font-bold">{formatMoney(total)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={confirmar} disabled={cargando || items.length === 0}>
            {cargando ? "Confirmando…" : "Confirmar venta"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            El número definitivo se asigna al confirmar.
          </p>
        </CardContent>
      </Card>

      <ClienteForm
        open={clienteDialog}
        onOpenChange={setClienteDialog}
        alCrear={(creado) => {
          setClientes((actuales) => [
            ...actuales,
            {
              id: creado.id,
              nombre: creado.nombre,
              tipoDoc: creado.tipoDoc,
              nroDoc: creado.nroDoc,
              cuentaCorriente: creado.cuentaCorriente,
              limiteCredito: creado.limiteCredito,
              saldo: creado.saldo ?? 0,
              disponible: creado.disponible ?? null,
            },
          ]);
          setClienteId(creado.id);
          setBuscaCliente("");
          toast.success(`${creado.nombre} seleccionado para la venta.`);
        }}
      />
    </div>
  );
}
