import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { CategoriaActions } from "@/components/productos/categoria-actions";
import { CategoriaCreateButton } from "@/components/productos/categoria-create-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import * as categoriasService from "@/lib/services/categorias.service";

export default async function CategoriasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin") redirect("/productos");

  const categorias = await categoriasService.listar(user);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/productos">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>
      </Button>

      <PageHeader
        title="Categorías"
        description="Clasificación del catálogo de productos."
        actions={<CategoriaCreateButton />}
      />

      <Card>
        {categorias.length === 0 ? (
          <EmptyState title="No hay categorías" description="Creá la primera categoría para cargar productos." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell>
                    <CategoriaActions categoria={categoria} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Suspense fallback={null} />
    </div>
  );
}
