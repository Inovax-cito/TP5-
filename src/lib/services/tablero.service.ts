import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { clientes, facturaItems, facturas, productos, type AuthUser } from "@/lib/db/schema";
import { dayBoundsArg, lastDays, monthBoundsArg, todayArg } from "@/lib/format";
import { saldoExpr } from "./saldos";

/** Argentina es UTC-3: agrupamos por día local antes de contar (RF-T2). */
const diaLocal = sql<string>`strftime('%Y-%m-%d', ${facturas.fecha}, 'unixepoch', '-3 hours')`;

async function resumen(desde: Date, hasta: Date) {
  const [row] = await db
    .select({
      cantidad: sql<number>`count(*)`,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        gte(facturas.fecha, desde),
        lte(facturas.fecha, hasta),
      ),
    );
  return {
    cantidad: Number(row?.cantidad ?? 0),
    importe: Number(row?.importe ?? 0),
  };
}

/** RF-T1 a RF-T3: toda la información del tablero en una sola respuesta. */
export async function obtener(usuario: AuthUser) {
  requireAuth(usuario);
  const ahora = new Date();
  const hoy = await resumen(dayBoundsArg(todayArg()).desde, ahora);
  const mesBounds = monthBoundsArg();
  const mes = await resumen(mesBounds.desde, mesBounds.hasta);
  const ticketPromedio = mes.cantidad > 0 ? Math.round(mes.importe / mes.cantidad) : 0;

  const [cc] = await db
    .select({
      totalAdeudado: sql<number>`coalesce(sum(case when ${saldoExpr} > 0 then ${saldoExpr} else 0 end), 0)`,
      clientesConSaldo: sql<number>`coalesce(sum(case when ${saldoExpr} > 0 then 1 else 0 end), 0)`,
    })
    .from(clientes)
    .where(eq(clientes.activo, true));

  const [minimo] = await db
    .select({ cantidad: sql<number>`count(*)` })
    .from(productos)
    .where(
      and(eq(productos.activo, true), sql`${productos.existencia} < ${productos.stockMinimo}`),
    );

  const dias = lastDays(30);
  const ventasPorDia = await db
    .select({ fecha: diaLocal, importe: sql<number>`coalesce(sum(${facturas.total}), 0)` })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        gte(facturas.fecha, dayBoundsArg(dias[0]).desde),
        lte(facturas.fecha, ahora),
      ),
    )
    .groupBy(diaLocal);
  const porFecha = new Map(ventasPorDia.map((v) => [v.fecha, Number(v.importe)]));

  const porForma = await db
    .select({
      forma: facturas.forma,
      importe: sql<number>`coalesce(sum(${facturas.total}), 0)`,
    })
    .from(facturas)
    .where(
      and(
        eq(facturas.estado, "emitida"),
        gte(facturas.fecha, mesBounds.desde),
        lte(facturas.fecha, mesBounds.hasta),
      ),
    )
    .groupBy(facturas.forma);

  const masVendidos = await db
    .select({
      productoId: facturaItems.productoId,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      unidades: sql<number>`sum(${facturaItems.cantidad})`,
      importe: sql<number>`sum(${facturaItems.subtotal})`,
    })
    .from(facturaItems)
    .innerJoin(facturas, eq(facturaItems.facturaId, facturas.id))
    .innerJoin(productos, eq(facturaItems.productoId, productos.id))
    .where(
      and(
        eq(facturas.estado, "emitida"),
        gte(facturas.fecha, mesBounds.desde),
        lte(facturas.fecha, mesBounds.hasta),
      ),
    )
    .groupBy(facturaItems.productoId, productos.codigo, productos.descripcion)
    .orderBy(desc(sql`sum(${facturaItems.cantidad})`))
    .limit(5);

  return {
    hoy,
    mes: { ...mes, ticketPromedio },
    cuentasCorrientes: {
      totalAdeudado: Number(cc?.totalAdeudado ?? 0),
      clientesConSaldo: Number(cc?.clientesConSaldo ?? 0),
    },
    bajoMinimo: { cantidad: Number(minimo?.cantidad ?? 0) },
    ventasDiarias: dias.map((fecha) => ({ fecha, importe: porFecha.get(fecha) ?? 0 })),
    porFormaDePago: porForma.map((f) => ({ forma: f.forma, importe: Number(f.importe) })),
    masVendidos: masVendidos.map((p) => ({
      productoId: p.productoId,
      codigo: p.codigo,
      descripcion: p.descripcion,
      unidades: Number(p.unidades),
      importe: Number(p.importe),
    })),
  };
}
