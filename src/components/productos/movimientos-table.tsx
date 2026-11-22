import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimeArg } from "@/lib/format";

type Movimiento = {
  id: number;
  tipo: string;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  observacion: string | null;
  fecha: string;
  referencia: { facturaId: number; numero: string } | null;
  usuario: { id: number; nombre: string } | { id: number; nombre: string };
};

const etiquetas: Record<string, string> = {
  venta: "Venta",
  anulacion: "Anulación",
  ingreso: "Ingreso",
  egreso: "Egreso",
};

export function MovimientosTable({
  movimientos,
  mostrarProducto = false,
}: {
  movimientos: Array<Movimiento & { producto?: { id: number; codigo: string; descripcion?: string } }>;
  mostrarProducto?: boolean;
}) {
  if (movimientos.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No hay movimientos registrados.</p>;
  }

  // En pantallas chicas se ocultan existencia, motivo, usuario y referencia.
  const o = mostrarProducto ? 1 : 0;
  const ocultar = { sm: [4 + o], md: [5 + o, 6 + o, 7 + o] } as { sm: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)[]; md: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)[] };

  return (
    <Table ocultar={ocultar}>
      <TableHeader>
        <TableRow>
          {mostrarProducto && <TableHead>Producto</TableHead>}
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead className="text-right">Existencia</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Referencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => {
          const positivo = movimiento.cantidad > 0;
          return (
            <TableRow key={movimiento.id}>
              {mostrarProducto && movimiento.producto && (
                <TableCell>
                  <Link href={`/productos/${movimiento.producto.id}`} className="font-medium hover:underline">
                    {movimiento.producto.codigo}
                  </Link>
                  {movimiento.producto.descripcion && (
                    <span className="block text-xs text-muted-foreground">{movimiento.producto.descripcion}</span>
                  )}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap text-xs">{formatDateTimeArg(movimiento.fecha)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    movimiento.tipo === "ingreso" || movimiento.tipo === "anulacion"
                      ? "success"
                      : movimiento.tipo === "egreso"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {etiquetas[movimiento.tipo] ?? movimiento.tipo}
                </Badge>
              </TableCell>
              <TableCell className={`tabular text-right font-semibold ${positivo ? "text-success" : "text-destructive"}`}>
                <span className="inline-flex items-center gap-1">
                  {positivo ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                  {positivo ? "+" : ""}
                  {movimiento.cantidad}
                </span>
              </TableCell>
              <TableCell className="tabular text-right">{movimiento.existenciaResultante}</TableCell>
              <TableCell>
                <span className="block text-sm">{movimiento.motivo}</span>
                {movimiento.observacion && (
                  <span className="block text-xs text-muted-foreground">{movimiento.observacion}</span>
                )}
              </TableCell>
              <TableCell className="text-xs">{movimiento.usuario.nombre}</TableCell>
              <TableCell>
                {movimiento.referencia ? (
                  <Link href={`/ventas/${movimiento.referencia.facturaId}`} className="text-xs font-medium text-primaryText hover:underline">
                    {movimiento.referencia.numero}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
