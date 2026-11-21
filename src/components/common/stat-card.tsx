import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  tono = "primary",
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: React.ComponentType<{ className?: string }>;
  tono?: "primary" | "success" | "warning" | "muted";
}) {
  const tonos = {
    primary: "bg-primary/10 text-primaryText",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
          <p className="tabular text-2xl font-bold tracking-tight">{valor}</p>
          {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", tonos[tono])}>
          <Icono className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
