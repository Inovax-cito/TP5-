import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderTree, History, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { PaginationLinks } from "@/components/common/pagination-links";
import { EmptyState } from "@/components/common/states";
import { ActivoBadge } from "@/components/common/status-badge";
import { ProductActions } from "@/components/productos/product-actions";
import { ProductoCreateButton } from "@/components/productos/producto-create-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";
import * as categoriasService from "@/lib/services/categorias.service";
import * as productosService from "@/lib/services/productos.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const valor = params[clave];
  return typeof valor === "string" ? valor : Array.isArray(valor) ? (valor[0] ?? "") : "";
};

export default async function ProductosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const q = valor(params, "q");
  const categoriaId = valor(params, "categoriaId");
  const bajoMinimo = valor(params, "bajoMinimo") === "true";
  const activo = valor(params, "activo");
  const page = valor(params, "page") || "1";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (categoriaId) query.set("categoriaId", categoriaId);
  if (bajoMinimo) query.set("bajoMinimo", "true");
  if (activo) query.set("activo", activo);
  query.set("page", page);

  const [productos, categorias] = await Promise.all([
    productosService.listar(user, query),
    categoriasService.listar(user),
  ]);

  const filtros = [
    { name: "q", label: "Buscar", placeholder: "Código o descripción" },
    {
      name: "categoriaId",
      label: "Categoría",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todas" },
        ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
      ],
    },
    {
      name: "activo",
      label: "Estado",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Activos" },
        { value: "todos", label: "Todos" },
        { value: "false", label: "Inactivos" },
      ],
    },
    { name: "bajoMinimo", label: "Existencias", tipo: "select" as const, opciones: [{ value: "", label: "Todas" }, { value: "true", label: "Bajo mínimo" }] },
  ];

  const urlBase = { q, categoriaId, bajoMinimo: bajoMinimo ? "true" : undefined, activo };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo, existencias y movimientos de stock."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/productos/movimientos">
                <History className="h-4 w-4" /> Movimientos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/productos/categorias">
                <FolderTree className="h-4 w-4" /> Categorías
              </Link>
            </Button>
            {user.rol === "admin" && <ProductoCreateButton categorias={categorias} />}
          </>
        }
      />

      <Tabs defaultValue={bajoMinimo ? "existencias" : "catalogo"}>
        <TabsList>
          <TabsTrigger value="catalogo" asChild>
            <Link href="/productos">Catálogo</Link>
          </TabsTrigger>
          <TabsTrigger value="existencias" asChild>
            <Link href="/productos?bajoMinimo=true">Existencias</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <FilterBar filtros={filtros} />
      </Suspense>

      <Card>
        {productos.data.length === 0 ? (
          <EmptyState
            title="No se encontraron productos"
            description="Probá con otra búsqueda o cargá un producto nuevo."
            action={
              user.rol === "admin" ? (
                <Button asChild>
                  <Link href="/productos/categorias">Cargar categorías</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  <TableHead>Estado</TableHead>
                  {user.rol === "admin" && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.data.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-mono text-xs font-medium">{producto.codigo}</TableCell>
                    <TableCell>
                      <Link href={`/productos/${producto.id}`} className="font-medium hover:underline">
                        {producto.descripcion}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{producto.categoria.nombre}</TableCell>
                    <TableCell className="tabular text-right font-medium">{formatMoney(producto.precio)}</TableCell>
                    <TableCell className="tabular text-right">
                      <span className="inline-flex items-center gap-2">
                        {producto.existencia}
                        {producto.bajoMinimo && (
                          <Badge variant="warning" title="Bajo el stock mínimo">
                            <TriangleAlert className="h-3 w-3" /> Bajo mínimo
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ActivoBadge activo={producto.activo} labelActivo="Activo" labelInactivo="Inactivo" />
                    </TableCell>
                    {user.rol === "admin" && (
                      <TableCell>
                        <ProductActions producto={producto} categorias={categorias} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationLinks
              page={productos.page}
              pageSize={productos.pageSize}
              total={productos.total}
              params={urlBase}
            />
          </>
        )}
      </Card>
    </div>
  );
}
