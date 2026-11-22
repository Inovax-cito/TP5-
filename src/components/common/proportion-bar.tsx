import { cn } from "@/lib/utils";

/** Barra de proporción (valor sobre máximo) para tablas del tablero. */
export function ProportionBar({
  valor,
  maximo,
  tono = "primary",
  className,
}: {
  valor: number;
  maximo: number;
  tono?: "primary" | "warning";
  className?: string;
}) {
  const porcentaje = Math.max(0, Math.min(100, (valor / Math.max(1, maximo)) * 100));
  return (
    <span className={cn("block h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted", className)} aria-hidden="true">
      <span
        className={cn(
          "block h-full rounded-full",
          tono === "primary" ? "bg-gradient-to-r from-primary/70 to-primary" : "bg-gradient-to-r from-warning/60 to-warning",
        )}
        style={{ width: `${porcentaje}%` }}
      />
    </span>
  );
}
