import { AlertCircle, Inbox, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Carga con la forma real de una pantalla de listado: encabezado, indicadores,
 * barra de filtros y tabla con columnas de texto, insignia e importe.
 */
export function LoadingState({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Cargando">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="flex gap-4 border-b bg-muted/50 px-5 py-3">
          {[20, 28, 16, 12].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-5 py-4 last:border-0">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-5 w-16 rounded-badge sm:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function EmptyState({
  title = "No hay resultados",
  description = "Probá con otros filtros o cargá un registro nuevo.",
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 border-dashed px-6 py-16 text-center shadow-none">
      <div className="relative">
        <div className="absolute inset-0 -m-3 rounded-full bg-primary/[0.06]" />
        <div className="relative rounded-full bg-gradient-to-br from-primary/15 to-primary/5 p-4 ring-1 ring-inset ring-primary/15">
          <Icon className="h-8 w-8 text-primaryText" />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-section">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 border-destructive/25 px-6 py-14 text-center">
      <div className="rounded-full bg-destructive/[0.08] p-4 ring-1 ring-inset ring-destructive/15">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <p className="text-section">No se pudo cargar la información</p>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Reintentar
        </Button>
      )}
    </Card>
  );
}

export function InlineSpinner({ label = "Procesando…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </span>
  );
}
