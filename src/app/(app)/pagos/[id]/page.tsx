import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/common/print-button";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/clientes/${recibo.cliente.id}`}>
            <ArrowLeft className="h-4 w-4" /> Volver al cliente
          </Link>
        </Button>
        <PrintButton label="Imprimir recibo" />
      </div>

      <Card className="print-full mx-auto max-w-2xl p-5 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Comprobante de pago</p>
            <h1 className="mt-1 text-3xl font-bold">{recibo.numeroRecibo}</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Gestión Comercial</p>
            <p className="text-muted-foreground">Comprobante interno</p>
            <p className="text-muted-foreground">Sin validez fiscal</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
            <p className="font-semibold">{recibo.cliente.nombre}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</p>
            <p className="font-semibold">{formatDateTimeArg(recibo.fecha)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Medio de pago</p>
            <p className="font-semibold">{medios[recibo.medio] ?? recibo.medio}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registrado por</p>
            <p className="font-semibold">{recibo.usuario.nombre}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="rounded-lg bg-muted p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Importe abonado</p>
          <p className="tabular mt-1 text-3xl font-bold">{formatMoney(recibo.importe)}</p>
        </div>

        {recibo.observacion && (
          <p className="mt-6 text-sm text-muted-foreground">
            <strong>Observación:</strong> {recibo.observacion}
          </p>
        )}

        <div className="mt-10 space-y-1 text-right text-sm">
          <p className="font-semibold">Saldo posterior del cliente</p>
          <p className="tabular text-lg">{formatMoney(recibo.saldoCliente ?? 0)}</p>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          Recibo generado por el sistema de gestión comercial
        </div>
      </Card>
    </div>
  );
}
