import { and, eq, lte, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/lib/db";
import { movimientosCuenta, secuencias } from "@/lib/db/schema";

/**
 * Regla 7 (RF-C4): saldo = débitos − créditos. Una sola fuente de verdad.
 * Usamos identificadores calificados con sql.raw: Drizzle no califica las columnas
 * dentro de fragmentos sql sueltos, y sin el prefijo la subconsulta se compararía
 * contra el id de movimientos_cuenta en lugar del de clientes.
 */
export const saldoExpr = sql<number>`coalesce((
  select sum(case when "movimientos_cuenta"."tipo" = 'debito'
    then "movimientos_cuenta"."importe" else -"movimientos_cuenta"."importe" end)
  from "movimientos_cuenta"
  where "movimientos_cuenta"."cliente_id" = "clientes"."id"
), 0)`;

/** Saldo de un cliente dentro (o fuera) de una transacción. */
export async function getSaldo(clienteId: number, executor: Db | Tx = db): Promise<number> {
  const rows = await (executor as Db)
    .select({
      saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito'
        then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
    })
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, clienteId));

  return Number(rows[0]?.saldo ?? 0);
}

/** RF-C5: saldo al momento de un recibo, para que la reimpresión coincida con el original. */
export async function getSaldoHasta(clienteId: number, fecha: Date): Promise<number> {
  const rows = await db
    .select({
      saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito'
        then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
    })
    .from(movimientosCuenta)
    .where(and(eq(movimientosCuenta.clienteId, clienteId), lte(movimientosCuenta.fecha, fecha)));

  return Number(rows[0]?.saldo ?? 0);
}

/**
 * Regla 4: asigna el próximo número de una secuencia DENTRO de la transacción.
 * Si la transacción se revierte, el incremento también: no quedan huecos.
 */
export async function nextSecuencia(executor: Db | Tx, tipo: "factura" | "recibo") {
  const tx = executor as Db;
  const rows = await tx
    .update(secuencias)
    .set({ ultimo: sql`${secuencias.ultimo} + 1` })
    .where(eq(secuencias.tipo, tipo))
    .returning({ ultimo: secuencias.ultimo, puntoVenta: secuencias.puntoVenta });

  if (!rows[0]) throw new Error(`Falta la secuencia ${tipo}. Ejecutá pnpm run db:seed.`);
  return rows[0];
}
