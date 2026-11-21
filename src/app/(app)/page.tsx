import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CircleAlert, CreditCard, ReceiptText, TrendingUp } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";
import * as productosService from "@/lib/services/productos.service";
import * as tableroService from "@/lib/services/tablero.service";

export default async function InicioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tablero, reposicion] = await Promise.all([
    tableroService.obtener(user),
    productosService.listar(user, new URLSearchParams("bajoMinimo=true&pageSize=5")),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${user.nombre.split(" ")[0]}`}
        description="Resumen de la actividad comercial de tu negocio."
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">
              <ReceiptText className="h-4 w-4" /> Nueva venta
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Ventas del día"
          valor={formatMoney(tablero.hoy.importe)}
          detalle={`${tablero.hoy.cantidad} facturas emitidas`}
          icono={TrendingUp}
        />
        <StatCard
          titulo="Ventas del mes"
          valor={formatMoney(tablero.mes.importe)}
          detalle={`${tablero.mes.cantidad} facturas · ticket ${formatMoney(tablero.mes.ticketPromedio)}`}
          icono={ReceiptText}
          tono="success"
        />
        <StatCard
          titulo="Cuentas corrientes"
          valor={formatMoney(tablero.cuentasCorrientes.totalAdeudado)}
          detalle={`${tablero.cuentasCorrientes.clientesConSaldo} clientes con deuda`}
          icono={CreditCard}
          tono="warning"
        />
        <StatCard
          titulo="Stock bajo mínimo"
          valor={String(tablero.bajoMinimo.cantidad)}
          detalle="Productos para reponer"
          icono={CircleAlert}
          tono={tablero.bajoMinimo.cantidad > 0 ? "warning" : "muted"}
        />
      </div>

      <DashboardCharts
        ventasDiarias={tablero.ventasDiarias}
        porFormaDePago={tablero.porFormaDePago}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Productos más vendidos</CardTitle>
              <CardDescription>Unidades vendidas en el mes.</CardDescription>
            </div>
            <Badge variant="secondary">Top 5</Badge>
          </CardHeader>
          <CardContent>
            {tablero.masVendidos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay ventas en el mes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tablero.masVendidos.map((producto) => (
                    <TableRow key={producto.productoId}>
                      <TableCell>
                        <p className="font-medium">{producto.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{producto.codigo}</p>
                      </TableCell>
                      <TableCell className="tabular text-right">{producto.unidades}</TableCell>
                      <TableCell className="tabular text-right font-medium">{formatMoney(producto.importe)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Reposición pendiente</CardTitle>
              <CardDescription>Productos por debajo del stock mínimo.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/productos?bajoMinimo=true">
                Ver todos <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {reposicion.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Todas las existencias están en orden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Existencia</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reposicion.data.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <p className="font-medium">{producto.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{producto.codigo}</p>
                      </TableCell>
                      <TableCell className="tabular text-right font-semibold text-warning">{producto.existencia}</TableCell>
                      <TableCell className="tabular text-right text-muted-foreground">{producto.stockMinimo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
