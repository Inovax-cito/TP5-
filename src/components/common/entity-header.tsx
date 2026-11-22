import { cn } from "@/lib/utils";

export type EntityStat = {
  label: string;
  valor: string;
  detalle?: React.ReactNode;
  tono?: "default" | "primary" | "success" | "warning";
  /** La cifra principal se muestra más grande y con fondo del tono. */
  destacada?: boolean;
};

const tonoTexto = {
  default: "text-foreground",
  primary: "text-primaryText",
  success: "text-success",
  warning: "text-warning",
};

const tonoFondo = {
  default: "bg-muted/50 border-border",
  primary: "bg-primary/[0.06] border-primary/20",
  success: "bg-success/[0.06] border-success/20",
  warning: "bg-warning/[0.07] border-warning/25",
};

/**
 * Cabecera de ficha (producto o cliente): imagen o avatar, título, datos clave,
 * acciones y las cifras importantes destacadas.
 */
export function EntityHeader({
  media,
  eyebrow,
  title,
  meta,
  actions,
  stats,
}: {
  media: React.ReactNode;
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  stats: EntityStat[];
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border/80 bg-card shadow-elevation-1">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {media}
          <div className="min-w-0 space-y-2">
            <p className="text-micro uppercase text-primaryText">{eyebrow}</p>
            <h1 className="break-words text-[1.375rem] font-bold leading-tight tracking-tight sm:text-title">{title}</h1>
            {meta && <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">{actions}</div>}
      </div>
      <div className="grid gap-3 border-t bg-muted/20 p-5 sm:grid-cols-3 sm:p-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-control border p-4 [container-type:inline-size]",
              stat.destacada ? tonoFondo[stat.tono ?? "default"] : "border-border/70 bg-card",
            )}
          >
            <p className="text-micro uppercase text-muted-foreground">{stat.label}</p>
            <p
              className={cn(
                "tabular mt-2 font-semibold leading-none tracking-tight",
                stat.destacada ? "text-[clamp(1.125rem,12cqi,2rem)]" : "text-[clamp(1rem,9cqi,1.375rem)]",
                tonoTexto[stat.tono ?? "default"],
              )}
            >
              {stat.valor}
            </p>
            {stat.detalle && <div className="mt-2 text-xs text-muted-foreground">{stat.detalle}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
