import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Mail, MapPin, Phone, ReceiptText } from "lucide-react";
import { EntityHeader } from "@/components/common/entity-header";
import { iniciales } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/common/filter-bar";
import { ActivoBadge, EstadoFacturaBadge } from "@/components/common/status-badge";
import { ClienteActions } from "@/components/clientes/cliente-actions";
import { PagoCreateButton } from "@/components/clientes/pago-create-button";
import { Grid, Inline, Stack, Text } from "@/components/layout/primitives";
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
    <Stack gap="6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/clientes">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
      </Button>

      <EntityHeader
        media={
          <Inline
            as="span"
            align="center"
            justify="center"
            className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-primary to-primaryText text-xl font-bold text-primary-foreground shadow-elevation-1 sm:h-20 sm:w-20 sm:text-2xl"
          >
            {iniciales(cliente.nombre)}
          </Inline>
        }
        eyebrow="Cliente"
        title={cliente.nombre}
        meta={
          <>
            <Text as="span" tabular weight="medium" className="text-foreground">{cliente.tipoDoc} {cliente.nroDoc}</Text>
            <Text as="span">·</Text>
            <ActivoBadge activo={cliente.activo} />
            {cliente.cuentaCorriente && <Badge variant="default">Cuenta corriente</Badge>}
          </>
        }
        actions={
          <>
            <PagoCreateButton cliente={cliente} variant="outline" />
            <ClienteActions cliente={cliente} />
          </>
        }
        stats={[
          {
            label: "Saldo actual",
            valor: formatMoney(cliente.saldo),
            tono: cliente.saldo > 0 ? "warning" : "success",
            destacada: true,
            detalle: cliente.saldo > 0 ? "Deuda en cuenta corriente" : "Sin deuda",
          },
          { label: "Límite de crédito", valor: cliente.limiteCredito === null ? "Sin límite" : formatMoney(cliente.limiteCredito) },
          {
            label: "Disponible",
            valor: cliente.disponible === null ? "Sin límite" : formatMoney(cliente.disponible),
            tono: "primary",
          },
        ]}
      />

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos"><ReceiptText /> Datos y facturas</TabsTrigger>
          <TabsTrigger value="cuenta"><CreditCard /> Cuenta corriente</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="space-y-4">
          <Card className="p-6">
            <Grid gap="4" cols={{ sm: 2, lg: 4 }}>
              <Inline align="start" gap="3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <Stack>
                  <Text size="xs" tone="muted">Domicilio</Text>
                  <Text size="sm" weight="medium">{cliente.domicilio ?? "-"}</Text>
                </Stack>
              </Inline>
              <Inline align="start" gap="3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <Stack>
                  <Text size="xs" tone="muted">Teléfono</Text>
                  <Text size="sm" weight="medium">{cliente.telefono ?? "-"}</Text>
                </Stack>
              </Inline>
              <Inline align="start" gap="3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <Stack>
                  <Text size="xs" tone="muted">Email</Text>
                  <Text size="sm" weight="medium">{cliente.email ?? "-"}</Text>
                </Stack>
              </Inline>
              <Stack>
                <Text size="xs" tone="muted">Cuenta corriente</Text>
                <Text size="sm" weight="medium">{cliente.cuentaCorriente ? "Habilitada" : "No habilitada"}</Text>
              </Stack>
            </Grid>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas facturas</CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.ultimasFacturas.length === 0 ? (
                <Text size="sm" tone="muted" align="center" className="py-8">Este cliente todavía no tiene facturas.</Text>
              ) : (
                <Table ocultar={{ sm: [2, 3, 4] }}>
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
                        <TableCell className="tabular text-xs">{factura.numeroFormateado}</TableCell>
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
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle>Movimientos</CardTitle>
              <Text as="span" size="sm" weight="semibold" tabular>Saldo: {formatMoney(cuenta.saldo)}</Text>
            </CardHeader>
            <CardContent>
              {cuenta.movimientos.length === 0 ? (
                <Text size="sm" tone="muted" align="center" className="py-10">No hay movimientos en el período.</Text>
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
                            <Text as="span" size="sm">{movimiento.descripcion}</Text>
                          )}
                        </TableCell>
                        <TableCell>
                          <Text as="span" size="xs" weight="semibold" tone={movimiento.tipo === "debito" ? "destructive" : "success"}>
                            {movimiento.tipo === "debito" ? "Débito" : "Crédito"}
                          </Text>
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
    </Stack>
  );
}
