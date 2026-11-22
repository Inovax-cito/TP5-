import { and, eq, gte, sql } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { movimientosStock, productos } from "@/lib/db/schema";
import { err } from "@/lib/errors";

export type TipoMovimientoStock = "venta" | "anulacion" | "ingreso" | "egreso";

export type MoverStockInput = {
  productoId: number;
  /** Cantidad con signo: negativo descuenta, positivo reingresa. */
  cantidad: number;
  tipo: TipoMovimientoStock;
  motivo: string;
  observacion?: string | null;
  facturaId?: number | null;
  usuarioId: number;
  fecha?: Date;
};

/**
 * Regla 1 y 2 (RF-P4, RF-P5, RF-V6, RF-V9): ÚNICO lugar donde cambia la existencia.
 * Actualiza con condición (`WHERE existencia >= ?`) y graba el movimiento en la
 * MISMA transacción. Dos ventas simultáneas de la última unidad: solo una pasa.
 * La suma de movimientos siempre da la existencia del producto.
 */
export async function moverStock(tx: Tx, input: MoverStockInput) {
  const { productoId, cantidad, tipo, motivo, observacion, facturaId, usuarioId, fecha } = input;
  if (cantidad === 0) return null;

  const update = tx
    .update(productos)
    .set({ existencia: sql`${productos.existencia} + ${cantidad}` })
    .returning({ existencia: productos.existencia });

  const updated =
    cantidad < 0
      ? await update.where(and(eq(productos.id, productoId), gte(productos.existencia, -cantidad)))
      : await update.where(eq(productos.id, productoId));

  if (updated.length === 0) {
    throw err.stockInsuficiente([
      { campo: "productoId", mensaje: String(productoId), solicitado: String(-cantidad) },
    ]);
  }

  const [movimiento] = await tx
    .insert(movimientosStock)
    .values({
      productoId,
      tipo,
      cantidad,
      existenciaResultante: updated[0].existencia,
      motivo,
      observacion: observacion ?? null,
      facturaId: facturaId ?? null,
      usuarioId,
      ...(fecha ? { createdAt: fecha } : {}),
    })
    .returning();

  return movimiento;
}
