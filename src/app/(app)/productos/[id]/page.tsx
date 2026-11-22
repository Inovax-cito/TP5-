import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Boxes, Package, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PaginationLinks } from "@/components/common/pagination-links";
import { StatCard } from "@/components/common/stat-card";
import { Grid, Stack, Text } from "@/components/layout/primitives";
import { MovimientosTable } from "@/components/productos/movimientos-table";
import { MovimientoCreateButton } from "@/components/productos/movimiento-create-button";
import { ProductImage } from "@/components/productos/product-image";
import { ProductActions } from "@/components/productos/product-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ApiError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import * as categoriasService from "@/lib/services/categorias.service";
import * as productosService from "@/lib/services/productos.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function ProductoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const productoId = Number(id);
  if (!Number.isInteger(productoId) || productoId <= 0) notFound();

  const search = await searchParams;
  const page = valor(search, "page") || "1";
  const query = new URLSearchParams({ page });

  let producto;
  try {
    producto = await productosService.obtener(user, productoId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [movimientos, categorias] = await Promise.all([
    productosService.movimientos(user, productoId, query),
    categoriasService.listar(user),
  ]);

  return (
    <Stack gap="6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/productos">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>
      </Button>

      <PageHeader
        title={producto.descripcion}
        description={`${producto.codigo} · ${producto.categoria.nombre}`}
        actions={
          <>
            {user.rol === "admin" && <MovimientoCreateButton producto={producto} />}
            {user.rol === "admin" && <ProductActions producto={producto} categorias={categorias} />}
          </>
        }
      />

      <Card className="flex items-center gap-4 p-4">
        <ProductImage src={producto.imagen} alt={producto.descripcion} className="h-20 w-20" />
        <Stack gap="1" className="min-w-0">
          <Text weight="semibold" className="break-words">{producto.descripcion}</Text>
          <Text size="xs" tone="muted">{producto.codigo} · {producto.categoria.nombre}</Text>
          <Text size="xs" tone="muted">Imagen del catálogo</Text>
        </Stack>
      </Card>

      <Grid gap="4" cols={{ sm: 3 }}>
        <StatCard titulo="Existencia actual" valor={String(producto.existencia)} icono={Boxes} tono={producto.bajoMinimo ? "warning" : "success"} detalle={producto.bajoMinimo ? "Por debajo del mínimo" : "Existencia normal"} />
        <StatCard titulo="Precio de venta" valor={formatMoney(producto.precio)} icono={Package} />
        <StatCard titulo="Stock mínimo" valor={String(producto.stockMinimo)} icono={TriangleAlert} detalle="Aviso de reposición" tono="muted" />
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <MovimientosTable movimientos={movimientos.data} />
          </Suspense>
          <PaginationLinks page={movimientos.page} pageSize={movimientos.pageSize} total={movimientos.total} />
        </CardContent>
      </Card>
    </Stack>
  );
}
