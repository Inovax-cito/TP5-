import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { PaginationLinks } from "@/components/common/pagination-links";
import { EmptyState } from "@/components/common/states";
import { EstadoFacturaBadge, FormaPagoBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatDate, formatMoney } from "@/lib/format";
import * as clientesService from "@/lib/services/clientes.service";
import * as facturasService from "@/lib/services/facturas.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function VentasPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const q = valor(params, "q");
  const desde = valor(params, "desde");
  const hasta = valor(params, "hasta");
  const forma = valor(params, "forma");
  const estado = valor(params, "estado");
  const clienteId = valor(params, "clienteId");
  const page = valor(params, "page") || "1";

  const query = new URLSearchParams({ page });
  if (q) query.set("q", q);
  if (desde) query.set("desde", desde);
  if (hasta) query.set("hasta", hasta);
  if (forma) query.set("forma", forma);
  if (estado) query.set("estado", estado);
  if (clienteId) query.set("clienteId", clienteId);

  const [facturas, clientes] = await Promise.all([
    facturasService.listar(user, query),
    clientesService.listar(user, new URLSearchParams("pageSize=100")),
  ]);

  const filtros = [
    { name: "q", label: "Buscar", placeholder: "Número o cliente" },
    { name: "desde", label: "Desde", tipo: "fecha" as const },
    { name: "hasta", label: "Hasta", tipo: "fecha" as const },
    {
      name: "forma",
      label: "Forma de pago",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todas" },
        { value: "contado", label: "Contado" },
        { value: "tarjeta", label: "Tarjeta" },
        { value: "cuenta_corriente", label: "Cuenta corriente" },
      ],
    },
    {
      name: "estado",
      label: "Estado",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todas" },
        { value: "emitida", label: "Emitida" },
        { value: "anulada", label: "Anulada" },
      ],
    },
    {
      name: "clienteId",
      label: "Cliente",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todos" },
        ...clientes.data.map((c) => ({ value: String(c.id), label: c.nombre })),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Facturas emitidas. Totales y saldos se actualizan al confirmar o anular."
        actions={
          <Button asChild>
            <Link href="/ventas/nueva">
              <Plus className="h-4 w-4" /> Nueva venta
            </Link>
          </Button>
        }
      />

      <Card className="flex items-center justify-between border-primary/20 bg-primary/5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total emitido</p>
          <p className="tabular text-2xl font-bold text-primary">{formatMoney(facturas.totalEmitido)}</p>
        </div>
        <p className="text-sm text-muted-foreground">{facturas.total} facturas en el filtro</p>
      </Card>

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <FilterBar filtros={filtros} />
      </Suspense>

      <Card>
        {facturas.data.length === 0 ? (
          <EmptyState
            title="No se encontraron facturas"
            description="Ajustá los filtros o cargá una nueva venta."
            action={
              <Button asChild>
                <Link href="/ventas/nueva">Nueva venta</Link>
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.data.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-mono text-xs font-medium">{factura.numeroFormateado}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(factura.fecha)}</TableCell>
                    <TableCell className="text-sm">{factura.cliente?.nombre ?? "Consumidor final"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{factura.vendedor.nombre}</TableCell>
                    <TableCell><FormaPagoBadge forma={factura.forma} /></TableCell>
                    <TableCell><EstadoFacturaBadge estado={factura.estado} /></TableCell>
                    <TableCell className="tabular text-right font-semibold">{formatMoney(factura.total)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/ventas/${factura.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationLinks
              page={facturas.page}
              pageSize={facturas.pageSize}
              total={facturas.total}
              params={{ q, desde, hasta, forma, estado, clienteId }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
