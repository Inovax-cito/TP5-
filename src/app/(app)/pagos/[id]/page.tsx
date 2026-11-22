import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/common/print-button";
import { BrandMark } from "@/components/layout/brand-mark";
import { Grid, Inline, Stack, Text, Title } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ApiError } from "@/lib/errors";
import { formatDateTimeArg, formatMoney } from "@/lib/format";
import * as pagosService from "@/lib/services/pagos.service";

const medios: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
};

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const pagoId = Number(id);
  if (!Number.isInteger(pagoId) || pagoId <= 0) notFound();

  let recibo;
  try {
    recibo = await pagosService.obtener(user, pagoId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <Stack gap="6">
      <Inline align="center" justify="between" className="no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/clientes/${recibo.cliente.id}`}>
            <ArrowLeft className="h-4 w-4" /> Volver al cliente
          </Link>
        </Button>
        <PrintButton label="Imprimir recibo" />
      </Inline>

      <Stack className="print-sheet bg-paper-desk -mx-4 px-3 py-6 sm:mx-0 sm:rounded-card sm:px-8 sm:py-10">
      <Card className="print-full relative mx-auto max-w-2xl overflow-hidden rounded-card p-6 shadow-elevation-3 sm:p-10">
        <Stack className="print-keep absolute inset-x-0 top-0 h-1.5 bg-primary print:relative print:mb-6 print:h-1" />
        <Inline wrap align="start" justify="between" gap="6">
          <Inline align="start" gap="3">
            <BrandMark size="lg" />
            <Stack className="text-sm">
              <Text weight="bold">Gestión Comercial</Text>
              <Text tone="muted">Comprobante interno</Text>
              <Text tone="muted">Sin validez fiscal</Text>
            </Stack>
          </Inline>
          <Stack align="right">
            <Text size="micro" caps="widest" tone="primary">Comprobante de pago</Text>
            <Title tabular size="2xl" className="mt-1">{recibo.numeroRecibo}</Title>
          </Stack>
        </Inline>

        <Separator className="my-6" />

        <Grid gap="6" cols={{ sm: 2 }} className="rounded-control border bg-muted/40 p-4 sm:p-5">
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Cliente</Text>
            <Text weight="semibold">{recibo.cliente.nombre}</Text>
          </Stack>
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Fecha</Text>
            <Text weight="semibold" tabular>{formatDateTimeArg(recibo.fecha)}</Text>
          </Stack>
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Medio de pago</Text>
            <Text weight="semibold">{medios[recibo.medio] ?? recibo.medio}</Text>
          </Stack>
          <Stack>
            <Text size="xs" caps="wide" tone="muted">Registrado por</Text>
            <Text weight="semibold">{recibo.usuario.nombre}</Text>
          </Stack>
        </Grid>

        <Separator className="my-6" />

        <Stack align="center" className="rounded-control border-2 border-dashed border-primary/30 bg-accent/50 p-6 sm:p-8">
          <Text size="xs" caps="wide" tone="muted">Importe abonado</Text>
          <Text size="3xl" weight="bold" tabular className="mt-1">{formatMoney(recibo.importe)}</Text>
        </Stack>

        {recibo.observacion && (
          <Text size="sm" tone="muted" className="mt-6">
            <Text as="strong">Observación:</Text> {recibo.observacion}
          </Text>
        )}

        <Stack gap="1" align="right" className="mt-10 text-sm">
          <Text weight="semibold">Saldo posterior del cliente</Text>
          <Text size="lg" tabular>{formatMoney(recibo.saldoCliente ?? 0)}</Text>
        </Stack>

        <Text as="div" size="xs" tone="muted" align="center" className="mt-12 border-t border-dashed pt-6">
          Recibo generado por el sistema de gestión comercial
        </Text>
      </Card>
      </Stack>
    </Stack>
  );
}
