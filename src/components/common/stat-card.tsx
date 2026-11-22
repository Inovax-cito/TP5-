import { cn } from "@/lib/utils";

const tonos = {
  primary: {
    borde: "before:bg-primary",
    icono: "from-primary/25 to-primary/5 text-primaryText ring-primary/20",
  },
  success: {
    borde: "before:bg-success",
    icono: "from-success/20 to-success/5 text-success ring-success/20",
  },
  warning: {
    borde: "before:bg-warning",
    icono: "from-warning/20 to-warning/5 text-warning ring-warning/20",
  },
  muted: {
    borde: "before:bg-neutral-300",
    icono: "from-neutral-200 to-neutral-100/60 text-muted-foreground ring-neutral-300/60",
  },
};

/** Indicador (el tamaño del número se ajusta al ancho de la tarjeta): número grande en mono, ícono con gradiente del tono y borde superior de acento. */
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
  const t = tonos[tono];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card [container-type:inline-size] border border-border/80 bg-card p-5 shadow-elevation-1 transition hover:-translate-y-0.5 hover:shadow-elevation-2",
        "before:absolute before:inset-x-0 before:top-0 before:h-[3px]",
        t.borde,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-gradient-to-br ring-1 ring-inset transition group-hover:scale-105",
            t.icono,
          )}
        >
          <Icono className="h-[18px] w-[18px]" />
        </span>
        <p className="text-micro uppercase text-muted-foreground">{titulo}</p>
      </div>
      <p className="tabular mt-4 whitespace-nowrap text-[clamp(1rem,10.5cqi,1.75rem)] font-semibold leading-none tracking-tight text-foreground">
        {valor}
      </p>
      {detalle && <p className="mt-2 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  );
}
