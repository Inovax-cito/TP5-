import { Badge } from "@/components/ui/badge";

export function EstadoFacturaBadge({ estado }: { estado: string }) {
  return estado === "anulada" ? <Badge variant="destructive">Anulada</Badge> : <Badge variant="success">Emitida</Badge>;
}

export function ActivoBadge({ activo, labelActivo = "Activo", labelInactivo = "Inactivo" }: { activo: boolean; labelActivo?: string; labelInactivo?: string }) {
  return activo ? <Badge variant="success">{labelActivo}</Badge> : <Badge variant="secondary">{labelInactivo}</Badge>;
}

export function FormaPagoBadge({ forma }: { forma: string }) {
  const mapa: Record<string, { texto: string; variante: "default" | "secondary" | "outline" | "success" }> = {
    contado: { texto: "Contado", variante: "success" },
    tarjeta: { texto: "Tarjeta", variante: "default" },
    cuenta_corriente: { texto: "Cuenta corriente", variante: "secondary" },
  };
  const item = mapa[forma] ?? { texto: forma, variante: "outline" as const };
  return <Badge variant={item.variante}>{item.texto}</Badge>;
}
