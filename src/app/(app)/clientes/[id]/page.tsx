import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { StatCard } from "@/components/common/stat-card";
import { EstadoFacturaBadge } from "@/components/common/status-badge";
import { ClienteActions } from "@/components/clientes/cliente-actions";
import { PagoCreateButton } from "@/components/clientes/pago-create-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ApiError } from "@/lib/errors";
import { formatDate, formatDateTimeArg, formatMoney } from "@/lib/format";
import * as clientesService from "@/lib/services/clientes.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const clienteId = Number(id);
  if (!Number.isInteger(clienteId) || clienteId <= 0) notFound();

  const search = await searchParams;
  const desde = valor(search, "desde");
  const hasta = valor(search, "hasta");
  const cuentaQuery = new URLSearchParams();
  if (desde) cuentaQuery.set("desde", desde);
  if (hasta) cuentaQuery.set("hasta", hasta);

  let cliente;
  try {
    cliente = await clientesService.obtener(user, clienteId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const cuenta = await clientesService.cuenta(user, clienteId, cuentaQuery);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/clientes">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
      </Button>

      <PageHeader
        title={cliente.nombre}
        description={`${cliente.tipoDoc} ${cliente.nroDoc} · ${cliente.activo ? "Activo" : "Inactivo"}`}
        actions={
          <>
            <PagoCreateButton cliente={cliente} variant="outline" />
            <ClienteActions cliente={cliente} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard titulo="Saldo actual" valor={formatMoney(cliente.saldo)} icono={CreditCard} tono={cliente.saldo > 0 ? "warning" : "success"} />
        <StatCard
          titulo="Límite de crédito"
          valor={cliente.limiteCredito === null ? "Sin límite" : formatMoney(cliente.limiteCredito)}
          icono={CreditCard}
          tono="muted"
        />
        <StatCard
          titulo="Disponible"
          valor={cliente.disponible === null ? "Sin límite" : formatMoney(cliente.disponible)}
          icono={CreditCard}
          tono="primary"
        />
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos y facturas</TabsTrigger>
          <TabsTrigger value="cuenta">Cuenta corriente</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="space-y-4">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Domicilio</p>
                  <p className="text-sm font-medium">{cliente.domicilio ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{cliente.telefono ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{cliente.email ?? "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuenta corriente</p>
                <p className="text-sm font-medium">{cliente.cuentaCorriente ? "Habilitada" : "No habilitada"}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas facturas</CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.ultimasFacturas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Este cliente todavía no tiene facturas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Forma de pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.ultimasFacturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell className="font-mono text-xs">{factura.numeroFormateado}</TableCell>
                        <TableCell className="text-xs">{formatDate(factura.fecha)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{factura.forma.replace("_", " ")}</TableCell>
                        <TableCell>
                          <EstadoFacturaBadge estado={factura.estado} />
                        </TableCell>
                        <TableCell className="tabular text-right font-medium">{formatMoney(factura.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/ventas/${factura.id}`}>Ver</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuenta" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <FilterBar
              filtros={[
                { name: "desde", label: "Desde", tipo: "fecha" },
                { name: "hasta", label: "Hasta", tipo: "fecha" },
              ]}
            />
          </Suspense>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Movimientos</CardTitle>
              <span className="tabular text-sm font-semibold">Saldo: {formatMoney(cuenta.saldo)}</span>
            </CardHeader>
            <CardContent>
              {cuenta.movimientos.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No hay movimientos en el período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {desde && (
                      <TableRow className="bg-muted/40">
                        <TableCell className="text-xs" colSpan={4}>
                          Saldo anterior al {formatDate(desde)}
                        </TableCell>
                        <TableCell className="tabular text-right text-xs">{formatMoney(cuenta.saldoAnterior)}</TableCell>
                      </TableRow>
                    )}
                    {cuenta.movimientos.map((movimiento, indice) => (
                      <TableRow key={`${movimiento.fecha}-${indice}`}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDateTimeArg(movimiento.fecha)}</TableCell>
                        <TableCell>
                          {movimiento.facturaId ? (
                            <Link href={`/ventas/${movimiento.facturaId}`} className="text-sm hover:underline">
                              {movimiento.descripcion}
                            </Link>
                          ) : movimiento.pagoId ? (
                            <Link href={`/pagos/${movimiento.pagoId}`} className="text-sm hover:underline">
                              {movimiento.descripcion}
                            </Link>
                          ) : (
                            <span className="text-sm">{movimiento.descripcion}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold ${movimiento.tipo === "debito" ? "text-destructive" : "text-success"}`}>
                            {movimiento.tipo === "debito" ? "Débito" : "Crédito"}
                          </span>
                        </TableCell>
                        <TableCell className={`tabular text-right font-medium ${movimiento.tipo === "debito" ? "text-destructive" : "text-success"}`}>
                          {movimiento.tipo === "debito" ? "+" : "-"}
                          {formatMoney(movimiento.importe)}
                        </TableCell>
                        <TableCell className="tabular text-right font-semibold">{formatMoney(movimiento.saldo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
