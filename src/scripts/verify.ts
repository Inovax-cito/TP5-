import { config } from "dotenv";
import { asc, sql } from "drizzle-orm";

config();

import { db } from "../lib/db";
import {
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  movimientosStock,
  productos,
} from "../lib/db/schema";

function fallar(mensaje: string, detalles: unknown[]) {
  console.error(`FALLÓ: ${mensaje}`, detalles.slice(0, 5));
  process.exit(1);
}

/**
 * Lista de control 10.8 #5: derivados = movimientos, reglas 1, 2, 7 y 8.
 * Revisa por producto y por cliente (no sólo totales) para evitar falsos OK.
 */
async function main() {
  const stocks = await db
    .select({ id: productos.id, codigo: productos.codigo, existencia: productos.existencia })
    .from(productos);
  if (!stocks.length) fallar("No hay productos. Ejecutá pnpm run db:seed.", []);

  // Regla 2: la existencia resultante de cada movimiento debe coincidir con la
  // suma acumulada hasta ese momento, y la última con la existencia guardada.
  const movimientos = await db
    .select({
      id: movimientosStock.id,
      productoId: movimientosStock.productoId,
      cantidad: movimientosStock.cantidad,
      existenciaResultante: movimientosStock.existenciaResultante,
      tipo: movimientosStock.tipo,
      facturaId: movimientosStock.facturaId,
    })
    .from(movimientosStock)
    .orderBy(asc(movimientosStock.id));

  const acumulado = new Map<number, number>();
  const cadenaMala: unknown[] = [];
  const reingresos = new Map<number, number>();
  for (const m of movimientos) {
    const esperado = (acumulado.get(m.productoId) ?? 0) + m.cantidad;
    if (m.existenciaResultante !== esperado) {
      cadenaMala.push({
        movimientoId: m.id,
        productoId: m.productoId,
        esperado,
        guardado: m.existenciaResultante,
      });
    }
    acumulado.set(m.productoId, m.existenciaResultante);
    if (m.tipo === "anulacion" && m.facturaId) {
      reingresos.set(m.facturaId, (reingresos.get(m.facturaId) ?? 0) + m.cantidad);
    }
  }

  const stocksMal = stocks.filter((p) => p.existencia !== (acumulado.get(p.id) ?? 0));
  const negativos = stocks.filter((p) => p.existencia < 0);

  // Regla 7: saldo por cliente = débitos − créditos; regla 8: nunca negativo.
  const clienteRows = await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes);
  const sumasCuenta = await db
    .select({
      clienteId: movimientosCuenta.clienteId,
      saldo: sql<number>`sum(case when ${movimientosCuenta.tipo} = 'debito'
        then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end)`,
    })
    .from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId);
  const saldoPorCliente = new Map(sumasCuenta.map((s) => [s.clienteId, Number(s.saldo)]));
  const saldosNegativos = clienteRows.filter((c) => (saldoPorCliente.get(c.id) ?? 0) < 0);
  const saldoTotal = clienteRows.reduce((acc, c) => acc + (saldoPorCliente.get(c.id) ?? 0), 0);

  // RF-V6 / RF-V9: cada factura cuadra con sus renglones y con su cuenta.
  const facturasRows = await db
    .select({
      id: facturas.id,
      estado: facturas.estado,
      forma: facturas.forma,
      total: facturas.total,
      clienteId: facturas.clienteId,
    })
    .from(facturas);
  const items = await db
    .select({ facturaId: facturaItems.facturaId, subtotal: facturaItems.subtotal, cantidad: facturaItems.cantidad })
    .from(facturaItems);
  const movsCuenta = await db
    .select({
      facturaId: movimientosCuenta.facturaId,
      tipo: movimientosCuenta.tipo,
      importe: movimientosCuenta.importe,
    })
    .from(movimientosCuenta);

  const sumaItems = new Map<number, number>();
  const unidadesItems = new Map<number, number>();
  for (const i of items) {
    sumaItems.set(i.facturaId, (sumaItems.get(i.facturaId) ?? 0) + i.subtotal);
    unidadesItems.set(i.facturaId, (unidadesItems.get(i.facturaId) ?? 0) + i.cantidad);
  }
  const debitos = new Map<number, number>();
  const creditos = new Map<number, number>();
  for (const m of movsCuenta) {
    if (!m.facturaId) continue;
    const destino = m.tipo === "debito" ? debitos : creditos;
    destino.set(m.facturaId, (destino.get(m.facturaId) ?? 0) + m.importe);
  }

  const facturasMal: unknown[] = [];
  for (const f of facturasRows) {
    if ((sumaItems.get(f.id) ?? 0) !== f.total) {
      facturasMal.push({ facturaId: f.id, motivo: "total ≠ suma de renglones" });
    }
    if (f.forma === "cuenta_corriente" && f.clienteId) {
      const debito = debitos.get(f.id) ?? 0;
      const credito = creditos.get(f.id) ?? 0;
      if (f.estado === "emitida" && debito !== f.total) {
        facturasMal.push({ facturaId: f.id, motivo: "emitida a cuenta sin débito" });
      }
      if (f.estado === "anulada" && (credito > f.total || credito > debito)) {
        facturasMal.push({ facturaId: f.id, motivo: "crédito de anulación superior al débito" });
      }
      if (f.estado === "anulada" && (reingresos.get(f.id) ?? 0) !== (unidadesItems.get(f.id) ?? 0)) {
        facturasMal.push({ facturaId: f.id, motivo: "anulación sin reingreso total de stock" });
      }
    }
  }

  console.log(`Productos verificados: ${stocks.length} (inconsistencias: ${stocksMal.length})`);
  console.log(`Movimientos con existencia resultante incorrecta: ${cadenaMala.length}`);
  console.log(`Clientes verificados: ${clienteRows.length} (saldos negativos: ${saldosNegativos.length})`);
  console.log(`Productos con existencia negativa: ${negativos.length}`);
  console.log(`Facturas verificadas: ${facturasRows.length} (inconsistencias: ${facturasMal.length})`);
  console.log(`Saldo total de clientes: ${saldoTotal} centavos`);

  if (stocksMal.length || negativos.length) {
    fallar("la existencia no coincide con sus movimientos o es negativa (reglas 1 y 2)", [
      ...stocksMal,
      ...negativos,
    ]);
  }
  if (cadenaMala.length) fallar("la cadena de existencia resultante está rota (regla 2)", cadenaMala);
  if (saldosNegativos.length) fallar("hay clientes con saldo a favor (regla 8)", saldosNegativos);
  if (facturasMal.length) fallar("facturas inconsistentes (RF-V6 / RF-V9)", facturasMal);

  console.log("OK: las reglas 1, 2, 7 y 8 se cumplen.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
