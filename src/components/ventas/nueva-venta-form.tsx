"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, BookUser, CreditCard, Minus, Plus, Search, ShieldCheck, ShoppingCart, Trash2, UserPlus, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field";
import { MoneyInput } from "@/components/common/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { ProductImage } from "@/components/productos/product-image";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { emitirFacturaSchema } from "@/lib/validations/facturas";

export type ProductoVenta = {
  id: number;
  codigo: string;
  descripcion: string;
  imagen?: string | null;
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

  const { ejecutar, errores, errorGeneral, cargando, marcarErrores } = useApiMutation(
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
    // Sección 8: los errores se muestran junto al campo, no sólo en un toast.
    if (items.length === 0) {
      marcarErrores({ items: "Agregá al menos un producto." });
      return;
    }
    if (forma === "cuenta_corriente" && (!cliente || !cliente.cuentaCorriente)) {
      marcarErrores({ clienteId: "Para vender a cuenta se necesita un cliente con cuenta corriente habilitada." });
      return;
    }
    if (forma === "cuenta_corriente" && cliente && cliente.limiteCredito !== null) {
      if (cliente.saldo + total > cliente.limiteCredito) {
        marcarErrores({ clienteId: "La venta supera el límite de crédito del cliente." });
        return;
      }
    }
    if (forma === "contado" && montoRecibido > 0 && montoRecibido < total) {
      marcarErrores({ "pago.montoRecibido": "El monto recibido no cubre el total." });
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
    <div
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]"
      onKeyDown={(e) => {
        // Sección 8: operación con teclado (buscar, Enter para agregar, Ctrl+Enter para confirmar).
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && (e.target as HTMLElement).tagName !== "BUTTON") {
          e.preventDefault();
          void confirmar();
        }
      }}
    >
      <div className="min-w-0 space-y-5">
        <Card>
          <CardHeader className="pb-4">
            <PasoTitulo numero={1} icono={UserRound} titulo="Comprador" listo={clienteId !== null || items.length > 0} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={clienteId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setClienteId(null)}
              >
                Consumidor final
              </Button>
              {cliente && (
                <Badge variant="default" dot className="h-8 px-3 text-sm">
                  {cliente.nombre}
                </Badge>
              )}
              <Button type="button" variant="ghost" size="sm" className="text-primaryText hover:text-primaryText" onClick={() => setClienteDialog(true)}>
                <UserPlus className="h-4 w-4" /> Dar de alta
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9 pr-20"
                placeholder="Buscar cliente por nombre o documento…"
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && clientesFiltrados[0]) {
                    e.preventDefault();
                    setClienteId(clientesFiltrados[0].id);
                    setBuscaCliente("");
                  }
                }}
              />
              <Kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex">Enter</Kbd>
            </div>
            {buscaCliente && (
              <div className="grid gap-2 sm:grid-cols-2">
                {clientesFiltrados.map((c, indice) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClienteId(c.id);
                      setBuscaCliente("");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-control border bg-card p-3 text-left text-sm transition hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      indice === 0 && "border-primary/40 bg-accent/60",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {c.nombre.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        <span className="tabular">{c.tipoDoc} {c.nroDoc}</span> {c.cuentaCorriente ? "· Cuenta corriente" : ""}
                      </span>
                    </span>
                  </button>
                ))}
                {clientesFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">No se encontró ese cliente.</p>
                )}
              </div>
            )}
            {errores.clienteId && <FieldError>{errores.clienteId}</FieldError>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <PasoTitulo numero={2} icono={ShoppingCart} titulo="Ítems" listo={items.length > 0} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9 pr-20"
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
              <Kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex">Enter</Kbd>
            </div>
            {buscaProducto && (
              <div className="grid gap-2 sm:grid-cols-2">
                {productosFiltrados.map((producto, indice) => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => agregarProducto(producto)}
                    className={cn(
                      "group flex items-center justify-between gap-2 rounded-control border bg-card p-2.5 text-left text-sm transition hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      indice === 0 && "border-primary/40 bg-accent/60",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ProductImage src={producto.imagen} alt={producto.descripcion} className="h-10 w-10" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{producto.descripcion}</span>
                        <span className="block text-xs text-muted-foreground">
                          <span className="tabular">{producto.codigo}</span> · {producto.existencia} disponibles
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tabular text-xs font-semibold">{formatMoney(producto.precio)}</span>
                      <Plus className="h-4 w-4 text-primaryText transition group-hover:scale-110" />
                    </span>
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay productos con existencia para ese texto.</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-control border border-dashed bg-muted/30 py-10 text-center">
                <ShoppingCart className="h-7 w-7 text-neutral-400" />
                <p className="text-sm text-muted-foreground">Todavía no agregaste productos.</p>
              </div>
            ) : (
              <div className="-mx-5 border-y sm:-mx-6">
                <Table ocultar={{ sm: [3] }}>
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
                          <p className="text-xs text-muted-foreground"><span className="tabular">{item.codigo}</span> · {item.existencia} disponibles</p>
                        </TableCell>
                        <TableCell>
                          <div className="mx-auto flex w-28 items-center rounded-control border bg-card shadow-elevation-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-r-none" onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              max={item.existencia}
                              value={item.cantidad}
                              onChange={(e) => cambiarCantidad(item.productoId, Number(e.target.value))}
                              className="tabular h-8 rounded-none border-0 px-1 text-center shadow-none focus-visible:ring-0"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-l-none" onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="tabular text-right text-sm text-muted-foreground">{formatMoney(item.precio)}</TableCell>
                        <TableCell className="tabular text-right font-semibold">{formatMoney(item.precio * item.cantidad)}</TableCell>
                        <TableCell className="w-10">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setItems((actuales) => actuales.filter((i) => i.productoId !== item.productoId))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {errores.items && <FieldError className="text-sm">{errores.items}</FieldError>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <PasoTitulo numero={3} icono={CreditCard} titulo="Forma de pago" />
          </CardHeader>
          <CardContent>
            <Tabs value={forma} onValueChange={(value) => setForma(value as Forma)}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-none border-0 bg-transparent p-0 sm:grid">
                {[
                  { value: "contado", label: "Contado", ayuda: "Efectivo", icono: Banknote, deshabilitado: false },
                  { value: "tarjeta", label: "Tarjeta", ayuda: "Débito o crédito", icono: CreditCard, deshabilitado: false },
                  { value: "cuenta_corriente", label: "Cuenta corriente", ayuda: "A cuenta del cliente", icono: BookUser, deshabilitado: !cliente?.cuentaCorriente },
                ].map((opcion) => (
                  <TabsTrigger
                    key={opcion.value}
                    value={opcion.value}
                    disabled={opcion.deshabilitado}
                    className="group relative h-auto flex-col items-start gap-1.5 whitespace-normal rounded-control border bg-card px-3 py-3 text-left shadow-elevation-1 hover:border-neutral-300 data-[state=active]:border-primary data-[state=active]:bg-accent/70 data-[state=active]:shadow-none data-[state=active]:ring-[3px] data-[state=active]:ring-primary/15 disabled:opacity-45 sm:px-4"
                  >
                    <span className="flex w-full items-center justify-between">
                      <opcion.icono className="!h-5 !w-5 text-muted-foreground group-data-[state=active]:text-primaryText" />
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-neutral-300 transition group-data-[state=active]:border-[5px] group-data-[state=active]:border-primary" />
                    </span>
                    <span className="text-xs font-semibold text-foreground sm:text-sm">{opcion.label}</span>
                    <span className="hidden text-[11px] font-normal text-muted-foreground sm:block">{opcion.ayuda}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="contado" className="mt-5 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monto-recibido">Monto recibido</Label>
                    <MoneyInput id="monto-recibido" value={montoRecibido} onChange={setMontoRecibido} className="tabular h-11 text-base" />
                    {errores["pago.montoRecibido"] && <FieldError>{errores["pago.montoRecibido"]}</FieldError>}
                    <p className="text-xs text-muted-foreground">Si se deja vacío se toma el total.</p>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col justify-center rounded-control border p-4",
                      vuelto < 0 ? "border-destructive/25 bg-destructive/[0.06]" : vuelto > 0 ? "border-success/25 bg-success/[0.07]" : "bg-muted/50",
                    )}
                  >
                    <p className="text-micro uppercase text-muted-foreground">Vuelto</p>
                    <p className={cn("tabular text-[1.75rem] font-semibold leading-tight", vuelto < 0 ? "text-destructive" : vuelto > 0 ? "text-success" : "text-foreground")}>
                      {formatMoney(vuelto)}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tarjeta" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tarjeta.tipo} onValueChange={(value) => setTarjeta({ ...tarjeta, tipo: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="ultimos4">Últimos 4 dígitos</Label>
                    <Input
                      id="ultimos4"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      className="tabular tracking-[0.3em]"
                      value={tarjeta.ultimos4}
                      onChange={(e) => setTarjeta({ ...tarjeta, ultimos4: e.target.value.replace(/\D/g, "") })}
                    />
                    {errores["pago.tarjeta.ultimos4"] && <FieldError>{errores["pago.tarjeta.ultimos4"]}</FieldError>}
                  </div>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Nunca ingreses el número completo de la tarjeta.
                </p>
              </TabsContent>

              <TabsContent value="cuenta_corriente" className="mt-5">
                {cliente ? (
                  <div className="grid gap-3 rounded-control border bg-muted/40 p-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-micro uppercase text-muted-foreground">Cliente</p>
                      <p className="font-semibold">{cliente.nombre}</p>
                    </div>
                    <div>
                      <p className="text-micro uppercase text-muted-foreground">Saldo actual</p>
                      <p className="tabular font-semibold">{formatMoney(cliente.saldo)}</p>
                    </div>
                    <div>
                      <p className="text-micro uppercase text-muted-foreground">Disponible</p>
                      <p className="tabular font-semibold text-success">
                        {cliente.disponible === null ? "Sin límite" : formatMoney(cliente.disponible)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-3">El nuevo saldo se registrará al confirmar la factura.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Seleccioná un cliente con cuenta corriente habilitada.</p>
                )}
              </TabsContent>
            </Tabs>
            {errores["pago.forma"] && <FieldError className="mt-2">{errores["pago.forma"]}</FieldError>}
          </CardContent>
        </Card>

        {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
      </div>

      <Card className="overflow-hidden lg:sticky lg:top-24">
        <div className="bg-sidebar px-5 pb-5 pt-4 text-sidebar-foreground sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-micro uppercase text-sidebar-muted">Resumen</p>
            <span className="tabular rounded-badge bg-white/[0.08] px-2 py-0.5 text-[11px] text-sidebar-muted">{proximoNumero}</span>
          </div>
          <p className="mt-4 text-xs text-sidebar-muted">Total</p>
          <p className="tabular text-[2.25rem] font-semibold leading-tight tracking-tight text-white">{formatMoney(total)}</p>
          <span className="mt-3 block h-1 w-14 rounded-full bg-sidebar-accent" />
        </div>
        <CardContent className="space-y-4 pt-5 sm:pt-6">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Comprador</span>
            <span className="truncate text-right font-medium">{cliente?.nombre ?? "Consumidor final"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Productos</span>
            <span className="font-medium"><span className="tabular">{items.reduce((acc, i) => acc + i.cantidad, 0)}</span> unidades</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Forma de pago</span>
            <span className="font-medium">{{ contado: "Contado", tarjeta: "Tarjeta", cuenta_corriente: "Cuenta corriente" }[forma]}</span>
          </div>
          {forma === "contado" && montoRecibido > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vuelto</span>
              <span className={cn("tabular font-semibold", vuelto < 0 ? "text-destructive" : "text-success")}>{formatMoney(vuelto)}</span>
            </div>
          )}
          <Button className="h-12 w-full text-base" size="lg" onClick={confirmar} disabled={cargando || items.length === 0}>
            {cargando ? "Confirmando…" : "Confirmar venta"}
          </Button>
          <div className="space-y-2 rounded-control bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Kbd>Enter</Kbd> agrega productos
            </p>
            <p className="flex items-center gap-1.5">
              <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> confirma la venta
            </p>
            <p>El número definitivo se asigna al confirmar.</p>
          </div>
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

/** Encabezado de cada bloque de la venta: número de paso, ícono y título. */
function PasoTitulo({
  numero,
  icono: Icono,
  titulo,
  listo,
}: {
  numero: number;
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  listo?: boolean;
}) {
  return (
    <CardTitle className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset transition",
          listo ? "bg-primary text-primary-foreground ring-primary" : "bg-muted text-muted-foreground ring-border",
        )}
      >
        {numero}
      </span>
      <span className="flex items-center gap-2">
        <Icono className="h-4 w-4 text-muted-foreground" />
        {titulo}
      </span>
    </CardTitle>
  );
}
