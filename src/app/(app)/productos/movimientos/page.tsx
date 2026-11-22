import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { PaginationLinks } from "@/components/common/pagination-links";
import { MovimientosTable } from "@/components/productos/movimientos-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import * as productosService from "@/lib/services/productos.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function MovimientosStockPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const productoId = valor(params, "productoId");
  const tipo = valor(params, "tipo");
  const desde = valor(params, "desde");
  const hasta = valor(params, "hasta");
  const page = valor(params, "page") || "1";

  const query = new URLSearchParams({ page });
  if (productoId) query.set("productoId", productoId);
  if (tipo) query.set("tipo", tipo);
  if (desde) query.set("desde", desde);
  if (hasta) query.set("hasta", hasta);

  const [movimientos, productos] = await Promise.all([
    productosService.movimientosGenerales(user, query),
    productosService.listar(user, new URLSearchParams("activo=todos&pageSize=100")),
  ]);

  const filtros = [
    {
      name: "productoId",
      label: "Producto",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todos" },
        ...productos.data.map((p) => ({ value: String(p.id), label: `${p.codigo} · ${p.descripcion}` })),
      ],
    },
    {
      name: "tipo",
      label: "Tipo",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todos" },
        { value: "ingreso", label: "Ingreso" },
        { value: "egreso", label: "Egreso" },
        { value: "venta", label: "Venta" },
        { value: "anulacion", label: "Anulación" },
      ],
    },
    { name: "desde", label: "Desde", tipo: "fecha" as const },
    { name: "hasta", label: "Hasta", tipo: "fecha" as const },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/productos">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>
      </Button>

      <PageHeader title="Movimientos de stock" description="Trazabilidad de ingresos, egresos, ventas y anulaciones." />

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <FilterBar filtros={filtros} />
      </Suspense>

      <Card>
        <MovimientosTable movimientos={movimientos.data} />
        <PaginationLinks
          page={movimientos.page}
          pageSize={movimientos.pageSize}
          total={movimientos.total}
          params={{ productoId, tipo, desde, hasta }}
        />
      </Card>
    </div>
  );
}
