import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PaginationLinks } from "@/components/common/pagination-links";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";
import * as clientesService from "@/lib/services/clientes.service";
import { Grid, Stack } from "@/components/layout/primitives";

type Search = Record<string, string | string[] | undefined>;

export default async function SaldosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const query = new URLSearchParams({ conDeuda: "true", orden: "saldo", page: rawPage, pageSize: "50" });
  const clientes = await clientesService.listar(user, query);

  return (
    <Stack gap="6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/clientes">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
      </Button>

      <PageHeader title="Saldos" description="Clientes con deuda, de mayor a menor." />

      <Grid gap="4" cols={{ sm: 2 }}>
        <StatCard
          titulo="Total adeudado"
          valor={formatMoney(clientes.totalAdeudado ?? 0)}
          detalle="Suma de saldos pendientes"
          icono={Users}
          tono="warning"
        />
        <StatCard titulo="Clientes con deuda" valor={String(clientes.total)} icono={Users} tono="muted" />
      </Grid>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Límite</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.data.map((cliente, indice) => (
              <TableRow key={cliente.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {(clientes.page - 1) * clientes.pageSize + indice + 1}
                </TableCell>
                <TableCell>
                  <Link href={`/clientes/${cliente.id}`} className="font-medium hover:underline">
                    {cliente.nombre}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {cliente.tipoDoc} {cliente.nroDoc}
                </TableCell>
                <TableCell className="tabular text-right font-semibold text-warning">{formatMoney(cliente.saldo)}</TableCell>
                <TableCell className="tabular text-right text-muted-foreground">
                  {cliente.limiteCredito === null ? "Sin límite" : formatMoney(cliente.limiteCredito)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/clientes/${cliente.id}`}>Ver cuenta</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationLinks
          page={clientes.page}
          pageSize={clientes.pageSize}
          total={clientes.total}
          params={{ conDeuda: "true", orden: "saldo" }}
        />
      </Card>
    </Stack>
  );
}
