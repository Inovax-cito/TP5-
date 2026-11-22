import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { EntityHeader } from "@/components/common/entity-header";
import { ProportionBar } from "@/components/common/proportion-bar";
import { ActivoBadge, BajoMinimoBadge } from "@/components/common/status-badge";
import { PaginationLinks } from "@/components/common/pagination-links";
import { Stack, Text } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
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

      <EntityHeader
        media={<ProductImage src={producto.imagen} alt={producto.descripcion} className="h-16 w-16 rounded-card sm:h-20 sm:w-20" />}
        eyebrow="Producto"
        title={producto.descripcion}
        meta={
          <>
            <Text as="span" tabular weight="medium" className="text-foreground">{producto.codigo}</Text>
            <Text as="span">·</Text>
            <Badge variant="secondary">{producto.categoria.nombre}</Badge>
            <ActivoBadge activo={producto.activo} />
            {producto.bajoMinimo && <BajoMinimoBadge />}
          </>
        }
        actions={
          user.rol === "admin" ? (
            <>
              <MovimientoCreateButton producto={producto} />
              <ProductActions producto={producto} categorias={categorias} />
            </>
          ) : undefined
        }
        stats={[
          {
            label: "Existencia actual",
            valor: String(producto.existencia),
            tono: producto.bajoMinimo ? "warning" : "success",
            destacada: true,
            detalle: (
              <Stack gap="1.5">
                <Text as="span">{producto.bajoMinimo ? "Por debajo del mínimo" : "Existencia normal"}</Text>
                <ProportionBar valor={producto.existencia} maximo={Math.max(producto.stockMinimo * 2, producto.existencia)} tono={producto.bajoMinimo ? "warning" : "primary"} />
              </Stack>
            ),
          },
          { label: "Precio de venta", valor: formatMoney(producto.precio) },
          { label: "Stock mínimo", valor: String(producto.stockMinimo), detalle: "Aviso de reposición" },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Historial de movimientos
          </CardTitle>
          <Text as="span" size="xs" tone="muted">{movimientos.total} movimientos</Text>
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
