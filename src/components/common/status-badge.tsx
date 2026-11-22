import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Insignias de estado del dominio: mismo texto de siempre, con punto de color y fondo tenue. */

export function EstadoFacturaBadge({ estado }: { estado: string }) {
  return estado === "anulada" ? (
    <Badge variant="destructive" dot>Anulada</Badge>
  ) : (
    <Badge variant="success" dot>Emitida</Badge>
  );
}

export function ActivoBadge({ activo, labelActivo = "Activo", labelInactivo = "Inactivo" }: { activo: boolean; labelActivo?: string; labelInactivo?: string }) {
  return activo ? (
    <Badge variant="success" dot>{labelActivo}</Badge>
  ) : (
    <Badge variant="secondary" dot>{labelInactivo}</Badge>
  );
}

export function BajoMinimoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" title="Bajo el stock mínimo" className={className}>
      <TriangleAlert /> Bajo mínimo
    </Badge>
  );
}

/** Rol del usuario. `tono="oscuro"` para el panel lateral. */
export function RolBadge({ rol, tono = "claro", className }: { rol: string; tono?: "claro" | "oscuro"; className?: string }) {
  const admin = rol === "admin";
  if (tono === "oscuro") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-badge px-1.5 py-px text-[10px] font-semibold uppercase leading-4 tracking-wider",
          admin ? "bg-sidebar-accent/15 text-sidebar-accent" : "bg-white/10 text-sidebar-foreground/80",
          className,
        )}
      >
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", admin ? "bg-sidebar-accent" : "bg-sidebar-muted")} />
        {admin ? "Administrador" : "Vendedor"}
      </span>
    );
  }
  return (
    <Badge variant={admin ? "default" : "secondary"} dot className={className}>
      {admin ? "Administrador" : "Vendedor"}
    </Badge>
  );
}

export function FormaPagoBadge({ forma }: { forma: string }) {
  const mapa: Record<string, { texto: string; variante: "default" | "secondary" | "outline" | "success" | "info" }> = {
    contado: { texto: "Contado", variante: "success" },
    tarjeta: { texto: "Tarjeta", variante: "info" },
    cuenta_corriente: { texto: "Cuenta corriente", variante: "default" },
  };
  const item = mapa[forma] ?? { texto: forma, variante: "outline" as const };
  return <Badge variant={item.variante}>{item.texto}</Badge>;
}
