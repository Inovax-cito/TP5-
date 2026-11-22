import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/common/print-button";
import { EstadoFacturaBadge, FormaPagoBadge } from "@/components/common/status-badge";
import { AnularFacturaButton } from "@/components/ventas/anular-factura-button";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href="/ventas">
            <ArrowLeft className="h-4 w-4" /> Volver a ventas
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <PrintButton label="Imprimir factura" />
          {factura.estado === "emitida" && user.rol === "admin" && (
            <AnularFacturaButton facturaId={factura.id} />
          )}
        </div>
      </div>

      {factura.estado === "anulada" && (
        <Card className="border-destructive/30 bg-destructive/5 p-5 no-print">
          <p className="font-semibold text-destructive">Esta factura fue anulada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Motivo: {factura.anulacion?.motivo}. Stock y saldos ya fueron revertidos.
          </p>
        </Card>
      )}

      <Card className="print-full mx-auto max-w-4xl p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Factura</p>
            <h1 className="tabular mt-1 text-3xl font-bold">{factura.numeroFormateado}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeArg(factura.fecha)}</p>
          </div>
          <div className="text-right">
            <div className="flex justify-end gap-2">
              <EstadoFacturaBadge estado={factura.estado} />
              <FormaPagoBadge forma={pago.forma} />
            </div>
            <p className="mt-3 font-bold">{comercio.nombre}</p>
            <p className="text-xs text-muted-foreground">Comprobante interno · Sin validez fiscal</p>
            {comercio.cuit && <p className="text-xs text-muted-foreground">CUIT {comercio.cuit}</p>}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Comprador</p>
            <p className="font-semibold">{factura.cliente?.nombre ?? "Consumidor final"}</p>
            <p className="text-xs text-muted-foreground">
              {factura.cliente ? `${factura.cliente.tipoDoc} ${factura.cliente.nroDoc}` : "Sin documento"}
            </p>
            {factura.cliente?.domicilio && (
              <p className="text-xs text-muted-foreground">{String(factura.cliente.domicilio)}</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendedor</p>
            <p className="font-semibold">{factura.vendedor.nombre}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Forma de pago</p>
            <p className="font-semibold">{formas[pago.forma] ?? pago.forma}</p>
            {pago.tarjeta && (
              <p className="text-xs text-muted-foreground">
                {pago.tarjeta.marca} {pago.tarjeta.tipo} ···· {pago.tarjeta.ultimos4}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <Table>
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
                <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                <TableCell className="text-sm">{item.descripcion}</TableCell>
                <TableCell className="tabular text-right">{item.cantidad}</TableCell>
                <TableCell className="tabular text-right text-sm">{formatMoney(item.precioUnitario)}</TableCell>
                <TableCell className="tabular text-right font-medium">{formatMoney(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="tabular text-2xl font-bold">{formatMoney(factura.total)}</span>
            </div>
            {pago.forma === "contado" && pago.montoRecibido !== undefined && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recibido</span>
                  <span className="tabular">{formatMoney(pago.montoRecibido)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vuelto</span>
                  <span className="tabular">{formatMoney(pago.vuelto ?? 0)}</span>
                </div>
              </>
            )}
            {"saldoCliente" in factura && (
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">Saldo del cliente</span>
                <span className="tabular font-semibold">{formatMoney(Number(factura.saldoCliente))}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 space-y-1 border-t pt-6 text-center text-xs text-muted-foreground">
          <p className="font-semibold">{comercio.nombre}</p>
          {comercio.direccion && <p>{comercio.direccion}</p>}
          {comercio.telefono && <p>Tel. {comercio.telefono}</p>}
          <p>Generado por el Sistema de Gestión Comercial</p>
        </div>
      </Card>
    </div>
  );
}
