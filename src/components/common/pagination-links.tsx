import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Paginación para listados Server Component: la página queda en la URL. */
export function PaginationLinks({
  page,
  pageSize,
  total,
  params = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  params?: Record<string, string | undefined>;
}) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const url = (destino: number) => {
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (valor) query.set(clave, valor);
    }
    query.set("page", String(destino));
    return `?${query.toString()}`;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Página {page} de {paginas} · {total} registros
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={url(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
          </Button>
        )}
        {page >= paginas ? (
          <Button variant="outline" size="sm" disabled>
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={url(page + 1)}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
