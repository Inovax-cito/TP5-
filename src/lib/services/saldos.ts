import { eq, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/lib/db";
import { clientes, movimientosCuenta, secuencias } from "@/lib/db/schema";

/** Regla 7 (RF-C4): saldo = débitos − créditos. Una sola fuente de verdad. */
export const saldoExpr = sql<number>`coalesce((
  select sum(case when ${movimientosCuenta.tipo} = 'debito'
    then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end)
  from ${movimientosCuenta}
  where ${movimientosCuenta.clienteId} = ${clientes.id}
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
