import { config } from "dotenv";
import { sql } from "drizzle-orm";

config();

import { db } from "../lib/db";
import { movimientosCuenta, movimientosStock, productos } from "../lib/db/schema";

/** Lista de control 10.8 #5: los derivados coinciden con sus movimientos. */
async function main() {
  const stocks = await db.select({ id: productos.id, codigo: productos.codigo, existencia: productos.existencia }).from(productos);
  const sumasStock = await db
    .select({ productoId: movimientosStock.productoId, suma: sql<number>`sum(${movimientosStock.cantidad})` })
    .from(movimientosStock)
    .groupBy(movimientosStock.productoId);
  const sumaPorProducto = new Map(sumasStock.map((s) => [s.productoId, Number(s.suma)]));

  const stocksMal = stocks.filter((p) => p.existencia !== (sumaPorProducto.get(p.id) ?? 0));
  const negativos = stocks.filter((p) => p.existencia < 0);

  const saldos = await db
    .select({
      clienteId: movimientosCuenta.clienteId,
      saldo: sql<number>`sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end)`,
    })
    .from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId);
  const saldoTotal = saldos.reduce((acc, s) => acc + Number(s.saldo), 0);

  console.log(`Productos verificados: ${stocks.length} (inconsistencias: ${stocksMal.length})`);
  console.log(`Clientes con movimientos: ${saldos.length}`);
  console.log(`Productos con existencia negativa: ${negativos.length}`);
  console.log(`Saldo total de clientes: ${saldoTotal} centavos`);

  if (stocksMal.length || negativos.length) {
    console.error("FALLÓ la verificación de invariantes.", stocksMal.slice(0, 3));
    process.exit(1);
  }
  console.log("OK: las reglas 1, 2 y 7 se cumplen.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
