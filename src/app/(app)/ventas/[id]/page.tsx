import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/common/print-button";
import { EstadoFacturaBadge, FormaPagoBadge } from "@/components/common/status-badge";
import { Grid, Inline, Stack, Text, Title } from "@/components/layout/primitives";
import { AnularFacturaButton } from "@/components/ventas/anular-factura-button";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDatosComercio } from "@/lib/comercio";
import { ApiError } from "@/lib/errors";
import { formatDateTimeArg, formatMoney } from "@/lib/format";
import * as facturasService from "@/lib/services/facturas.service";

const formas: Record<string, string> = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const facturaId = Number(id);
  if (!Number.isInteger(facturaId) || facturaId <= 0) notFound();

  let factura;
  try {
    factura = await facturasService.obtener(user, facturaId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const pago = factura.pago as {
    forma: string;
    montoRecibido?: number;
    vuelto?: number;
    tarjeta?: { tipo: string; marca: string; ultimos4: string };
  };
  const comercio = getDatosComercio();

  return (
    <Stack gap="6">
      <Inline wrap align="center" justify="between" gap="3" className="no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ventas">
            <ArrowLeft className="h-4 w-4" /> Volver a ventas
          </Link>
        </Button>
        <Inline wrap gap="2">
          <PrintButton label="Imprimir factura" />
          {factura.estado === "emitida" && user.rol === "admin" && (
            <AnularFacturaButton facturaId={factura.id} />
          )}
        </Inline>
      </Inline>

      {factura.estado === "anulada" && (
        <Card className="border-destructive/30 bg-destructive/5 p-5 no-print">
          <Text weight="semibold" tone="destructive">Esta factura fue anulada</Text>
          <Text size="sm" tone="muted" className="mt-1">
            Motivo: {factura.anulacion?.motivo}. Stock y saldos ya fueron revertidos.
          </Text>
        </Card>
      )}

      <Stack className="print-sheet bg-paper-desk -mx-4 px-3 py-6 sm:mx-0 sm:rounded-card sm:px-8 sm:py-10">
      <Card className="print-full relative mx-auto max-w-4xl overflow-hidden rounded-card p-6 shadow-elevation-3 sm:p-10">
        <Stack className="print-keep absolute inset-x-0 top-0 h-1.5 bg-primary print:relative print:mb-6 print:h-1" />
        <Inline wrap align="start" justify="between" gap="6">
          <Inline align="start" gap="3">
            <BrandMark size="lg" />
            <Stack>
              <Text weight="bold" size="lg">{comercio.nombre}</Text>
              <Text size="xs" tone="muted">Comprobante interno · Sin validez fiscal</Text>
              {comercio.cuit && <Text size="xs" tone="muted" tabular>CUIT {comercio.cuit}</Text>}
            </Stack>
          </Inline>
          <Stack align="right">
            <Text size="micro" caps="widest" tone="primary">Factura</Text>
            <Title tabular size="2xl" className="mt-1 sm:text-[1.875rem]">{factura.numeroFormateado}</Title>
            <Text size="xs" tone="muted" tabular className="mt-1">{formatDateTimeArg(factura.fecha)}</Text>
            <Inline justify="end" gap="2" className="mt-3">
              <EstadoFacturaBadge estado={factura.estado} />
              <FormaPagoBadge forma={pago.forma} />
            </Inline>
          </Stack>
        </Inline>

        <Separator className="my-6" />

        <Grid gap="6" cols={{ sm: 3 }} className="rounded-control border bg-muted/40 p-4 sm:p-5">
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Comprador</Text>
            <Text weight="semibold">{factura.cliente?.nombre ?? "Consumidor final"}</Text>
            <Text size="xs" tone="muted" tabular={Boolean(factura.cliente)}>
              {factura.cliente ? `${factura.cliente.tipoDoc} ${factura.cliente.nroDoc}` : "Sin documento"}
            </Text>
            {factura.cliente?.domicilio && (
              <Text size="xs" tone="muted">{String(factura.cliente.domicilio)}</Text>
            )}
          </Stack>
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Vendedor</Text>
            <Text weight="semibold">{factura.vendedor.nombre}</Text>
          </Stack>
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Forma de pago</Text>
            <Text weight="semibold">{formas[pago.forma] ?? pago.forma}</Text>
            {pago.tarjeta && (
              <Text size="xs" tone="muted">
                {pago.tarjeta.marca} {pago.tarjeta.tipo} ···· {pago.tarjeta.ultimos4}
              </Text>
            )}
          </Stack>
        </Grid>

        <Separator className="my-6" />

        <Table ocultar={{ sm: [1, 4] }}>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factura.items.map((item, indice) => (
              <TableRow key={`${item.productoId}-${indice}`}>
                <TableCell className="tabular text-xs">{item.codigo}</TableCell>
                <TableCell className="text-sm">{item.descripcion}</TableCell>
                <TableCell className="tabular text-right">{item.cantidad}</TableCell>
                <TableCell className="tabular text-right text-sm">{formatMoney(item.precioUnitario)}</TableCell>
                <TableCell className="tabular text-right font-medium">{formatMoney(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Inline justify="end" className="mt-6">
          <Stack gap="2" className="w-full max-w-sm rounded-control border bg-muted/40 p-4 sm:p-5">
            <Inline justify="between" align="baseline" className="border-b pb-3 text-sm">
              <Text as="span" weight="semibold">Total</Text>
              <Text as="span" size="2xl" weight="bold" tabular>{formatMoney(factura.total)}</Text>
            </Inline>
            {pago.forma === "contado" && pago.montoRecibido !== undefined && (
              <>
                <Inline justify="between" className="text-sm">
                  <Text as="span" tone="muted">Recibido</Text>
                  <Text as="span" tabular>{formatMoney(pago.montoRecibido)}</Text>
                </Inline>
                <Inline justify="between" className="text-sm">
                  <Text as="span" tone="muted">Vuelto</Text>
                  <Text as="span" tabular>{formatMoney(pago.vuelto ?? 0)}</Text>
                </Inline>
              </>
            )}
            {"saldoCliente" in factura && (
              <Inline justify="between" className="border-t pt-2 text-sm">
                <Text as="span" tone="muted">Saldo del cliente</Text>
                <Text as="span" weight="semibold" tabular>{formatMoney(Number(factura.saldoCliente))}</Text>
              </Inline>
            )}
          </Stack>
        </Inline>

        <Stack gap="1" align="center" className="mt-12 border-t border-dashed pt-6 text-xs text-muted-foreground">
          <Text weight="semibold">{comercio.nombre}</Text>
          {comercio.direccion && <Text>{comercio.direccion}</Text>}
          {comercio.telefono && <Text>Tel. {comercio.telefono}</Text>}
          <Text>Generado por el Sistema de Gestión Comercial</Text>
        </Stack>
      </Card>
      </Stack>
    </Stack>
  );
}
