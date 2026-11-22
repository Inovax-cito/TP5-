import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { PaginationLinks } from "@/components/common/pagination-links";
import { EmptyState } from "@/components/common/states";
import { ActivoBadge } from "@/components/common/status-badge";
import { UsuarioActions } from "@/components/usuarios/usuario-actions";
import { UsuarioCreateButton } from "@/components/usuarios/usuario-create-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import * as usuariosService from "@/lib/services/usuarios.service";
import { Stack } from "@/components/layout/primitives";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin") redirect("/perfil");

  const params = await searchParams;
  const q = valor(params, "q");
  const activo = valor(params, "activo");
  const page = valor(params, "page") || "1";

  const query = new URLSearchParams({ page });
  if (q) query.set("q", q);
  if (activo) query.set("activo", activo === "true" ? "true" : "false");

  const usuarios = await usuariosService.listar(user, query);

  const filtros = [
    { name: "q", label: "Buscar", placeholder: "Nombre o email" },
    {
      name: "activo",
      label: "Estado",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todos" },
        { value: "true", label: "Activos" },
        { value: "false", label: "Inactivos" },
      ],
    },
  ];

  return (
    <Stack gap="6">
      <PageHeader
        title="Usuarios"
        description="Gestión de accesos, roles y contraseñas del sistema."
        actions={<UsuarioCreateButton />}
      />

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <FilterBar filtros={filtros} />
      </Suspense>

      <Card>
        {usuarios.data.length === 0 ? (
          <EmptyState title="No se encontraron usuarios" description="Probá con otra búsqueda." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.nombre}
                      {u.id === user.id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">Vos</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.rol === "admin" ? "default" : "secondary"}>
                        {u.rol === "admin" ? "Administrador" : "Vendedor"}
                      </Badge>
                    </TableCell>
                    <TableCell><ActivoBadge activo={u.activo} /></TableCell>
                    <TableCell>
                      <UsuarioActions usuario={u} esMismoUsuario={u.id === user.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationLinks page={usuarios.page} pageSize={usuarios.pageSize} total={usuarios.total} params={{ q, activo }} />
          </>
        )}
      </Card>
    </Stack>
  );
}
