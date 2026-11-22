import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { PaginationLinks } from "@/components/common/pagination-links";
import { EmptyState } from "@/components/common/states";
import { ActivoBadge } from "@/components/common/status-badge";
import { ClienteActions } from "@/components/clientes/cliente-actions";
import { ClienteCreateButton } from "@/components/clientes/cliente-create-button";
import { Stack, Text } from "@/components/layout/primitives";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";
import * as clientesService from "@/lib/services/clientes.service";

type Search = Record<string, string | string[] | undefined>;
const valor = (params: Search, clave: string) => {
  const v = params[clave];
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
};

export default async function ClientesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const q = valor(params, "q");
  const conDeuda = valor(params, "conDeuda") === "true";
  const orden = valor(params, "orden");
  const page = valor(params, "page") || "1";

  const query = new URLSearchParams({ page });
  if (q) query.set("q", q);
  if (conDeuda) query.set("conDeuda", "true");
  if (orden) query.set("orden", orden);

  const clientes = await clientesService.listar(user, query);

  const filtros = [
    { name: "q", label: "Buscar", placeholder: "Nombre o documento" },
    {
      name: "conDeuda",
      label: "Saldos",
      tipo: "select" as const,
      opciones: [
        { value: "", label: "Todos" },
        { value: "true", label: "Solo con deuda" },
      ],
    },
    {
      name: "orden",
      label: "Ordenar por",
      tipo: "select" as const,
      opciones: [
        { value: "nombre", label: "Nombre" },
        { value: "saldo", label: "Mayor saldo" },
      ],
    },
  ];

  return (
    <Stack gap="6">
      <PageHeader
        title="Clientes"
        description="Fichas, saldos y cuenta corriente."
        actions={
          <>
            <Link href="/clientes/saldos" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent">
              <Wallet className="h-4 w-4" /> Saldos
            </Link>
            <ClienteCreateButton />
          </>
        }
      />

      {conDeuda && clientes.totalAdeudado !== undefined && (
        <Card className="flex items-center justify-between border-warning/30 bg-warning/5 p-5">
          <Stack>
            <Text size="xs" weight="semibold" caps="wide" tone="muted">Total adeudado</Text>
            <Text size="2xl" weight="bold" tone="warning" tabular>{formatMoney(clientes.totalAdeudado)}</Text>
          </Stack>
          <Text size="sm" tone="muted">{clientes.total} clientes con deuda</Text>
        </Card>
      )}

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <FilterBar filtros={filtros} />
      </Suspense>

      <Card>
        {clientes.data.length === 0 ? (
          <EmptyState title="No se encontraron clientes" description="Probá con otro nombre o documento." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cuenta corriente</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.data.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <Link href={`/clientes/${cliente.id}`} className="font-medium hover:underline">
                        {cliente.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cliente.tipoDoc} {cliente.nroDoc}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cliente.email ?? cliente.telefono ?? "-"}</TableCell>
                    <TableCell>
                      {cliente.cuentaCorriente ? (
                        // whitespace-pre-line corta la línea igual que el <br> que había antes.
                        <Text as="span" size="xs" tone="muted" className="whitespace-pre-line">
                          {`Límite ${cliente.limiteCredito === null ? "sin definir" : formatMoney(cliente.limiteCredito)}\nDisponible ${cliente.disponible === null ? "—" : formatMoney(cliente.disponible)}`}
                        </Text>
                      ) : (
                        <Text as="span" size="xs" tone="muted">No habilitada</Text>
                      )}
                    </TableCell>
                    <TableCell className={`tabular text-right font-semibold ${cliente.saldo > 0 ? "text-warning" : ""}`}>
                      {formatMoney(cliente.saldo)}
                    </TableCell>
                    <TableCell>
                      <ActivoBadge activo={cliente.activo} />
                    </TableCell>
                    <TableCell>
                      <ClienteActions cliente={cliente} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationLinks
              page={clientes.page}
              pageSize={clientes.pageSize}
              total={clientes.total}
              params={{ q, conDeuda: conDeuda ? "true" : undefined, orden }}
            />
          </>
        )}
      </Card>
    </Stack>
  );
}
