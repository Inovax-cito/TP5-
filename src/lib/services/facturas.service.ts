import { and, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import { getPagination } from "@/lib/api/pagination";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { db, type Db, type Tx } from "@/lib/db";
import {
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
  secuencias,
  usuarios,
  type AuthUser,
} from "@/lib/db/schema";
import { ApiError, err } from "@/lib/errors";
import { dayBoundsArg, formatNumero, parseNumeroFactura } from "@/lib/format";
import { parseOrThrow } from "@/lib/validations/parse";
import { anularFacturaSchema, emitirFacturaSchema } from "@/lib/validations/facturas";
import { getSaldo, nextSecuencia } from "./saldos";
import { moverStock } from "./stock.service";

type Executor = Db | Tx;
const exec = (e: Executor) => e as Db;

/** RF-V7: armar la forma pública de la factura (reutilizada por emisión, consulta y anulación). */
async function buildFactura(executor: Executor, id: number) {
  const e = exec(executor);
  const [f] = await e.select().from(facturas).where(eq(facturas.id, id)).limit(1);
  if (!f) throw err.noEncontrado("La factura");

  const items = await e
    .select()
    .from(facturaItems)
    .where(eq(facturaItems.facturaId, id))
    .orderBy(facturaItems.id);

  let cliente: Record<string, string | number | null> | null = null;
  if (f.clienteId) {
    const [c] = await e.select().from(clientes).where(eq(clientes.id, f.clienteId)).limit(1);
    if (c) {
      cliente = {
        id: c.id,
        nombre: c.nombre,
        tipoDoc: c.tipoDoc,
        nroDoc: c.nroDoc,
        domicilio: c.domicilio,
      };
    }
  }

  const [vendedor] = await e.select().from(usuarios).where(eq(usuarios.id, f.usuarioId)).limit(1);

  const pago: Record<string, unknown> = { forma: f.forma };
  if (f.forma === "contado") {
    pago.montoRecibido = f.montoRecibido;
    pago.vuelto = (f.montoRecibido ?? f.total) - f.total;
  } else if (f.forma === "tarjeta") {
    pago.tarjeta = {
      tipo: f.tarjetaTipo,
      marca: f.tarjetaMarca,
      ultimos4: f.tarjetaUltimos4,
    };
  }

  return {
    id: f.id,
    puntoVenta: f.puntoVenta,
    numero: f.numero,
    numeroFormateado: formatNumero(f.puntoVenta, f.numero),
    fecha: f.fecha.toISOString(),
    estado: f.estado,
    cliente,
    vendedor: { id: f.usuarioId, nombre: vendedor?.nombre ?? "" },
    items: items.map((item) => ({
      productoId: item.productoId,
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal,
    })),
    total: f.total,
    pago,
    ...(f.forma === "cuenta_corriente" && f.clienteId
      ? { saldoCliente: await getSaldo(f.clienteId, executor) }
      : {}),
    ...(f.estado === "anulada"
      ? {
          anulacion: {
            fecha: f.anulacionFecha?.toISOString() ?? null,
            motivo: f.motivoAnulacion,
            usuarioId: f.anulacionUsuarioId,
          },
        }
      : {}),
  };
}

/**
 * RF-V1 a RF-V6 / reglas 1, 2, 3, 4, 6, 7, 9, 11:
 * una sola transacción: valida, fija precios, numera, graba factura + renglones,
 * descuenta stock con movimientos y registra el débito en cuenta corriente.
 * O se graba todo o nada.
 */
export async function emitir(usuario: AuthUser, input: unknown, opciones?: { fecha?: Date }) {
  requireAuth(usuario);
  const data = parseOrThrow(emitirFacturaSchema, input);

  return db.transaction(async (tx) => {
    const ids = data.items.map((i) => i.productoId);
    const filas = await tx.select().from(productos).where(inArray(productos.id, ids));
    const porId = new Map(filas.map((p) => [p.id, p]));

    for (const item of data.items) {
      const producto = porId.get(item.productoId);
      if (!producto) throw err.noEncontrado("Uno de los productos");
      if (!producto.activo) {
        throw new ApiError(422, "PRODUCTO_INACTIVO", `El producto ${producto.codigo} no está disponible.`);
      }
    }

    let cliente: typeof clientes.$inferSelect | undefined;
    if (data.clienteId) {
      const [c] = await tx.select().from(clientes).where(eq(clientes.id, data.clienteId)).limit(1);
      if (!c) throw err.noEncontrado("El cliente");
      if (!c.activo) {
        throw new ApiError(422, "VALIDACION", "El cliente está dado de baja.", [
          { campo: "clienteId", mensaje: "El cliente está dado de baja." },
        ]);
      }
      cliente = c;
    }

    if (data.pago.forma === "cuenta_corriente" && (!cliente || !cliente.cuentaCorriente)) {
      throw new ApiError(
        422,
        "CUENTA_CORRIENTE_NO_HABILITADA",
        "Para vender a cuenta se necesita un cliente registrado y habilitado.",
      );
    }

    const itemsCalculados = data.items.map((item) => {
      const producto = porId.get(item.productoId)!;
      return {
        producto,
        productoId: item.productoId,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * item.cantidad,
      };
    });
    const total = itemsCalculados.reduce((acc, i) => acc + i.subtotal, 0);

    let montoRecibido: number | null = null;
    if (data.pago.forma === "contado") {
      montoRecibido = data.pago.montoRecibido ?? total;
      if (montoRecibido < total) {
        throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total de la venta.");
      }
    }

    if (data.pago.forma === "cuenta_corriente" && cliente) {
      const saldoActual = await getSaldo(cliente.id, tx);
      const nuevoSaldo = saldoActual + total;
      if (cliente.limiteCredito !== null && nuevoSaldo > cliente.limiteCredito) {
        throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito del cliente.", [
          {
            campo: "limiteCredito",
            mensaje: "Límite excedido.",
            saldoActual,
            limite: cliente.limiteCredito,
            excedente: nuevoSaldo - cliente.limiteCredito,
          },
        ]);
      }
    }

    // Regla 1: control anticipado con detalle por producto; el UPDATE condicional
    // de moverStock es la segunda barrera atómica frente a ventas simultáneas.
    const faltantes = itemsCalculados
      .filter((i) => i.producto.existencia < i.cantidad)
      .map((i) => ({
        campo: "productoId",
        mensaje: `${i.producto.codigo}: se pidieron ${i.cantidad} y hay ${i.producto.existencia}.`,
        productoId: i.productoId,
        solicitado: i.cantidad,
        disponible: i.producto.existencia,
      }));
    if (faltantes.length) throw err.stockInsuficiente(faltantes);

    const secuencia = await nextSecuencia(tx, "factura");
    const fecha = opciones?.fecha ?? new Date();

    const [factura] = await tx
      .insert(facturas)
      .values({
        puntoVenta: secuencia.puntoVenta,
        numero: secuencia.ultimo,
        fecha,
        total,
        forma: data.pago.forma,
        montoRecibido,
        tarjetaTipo: data.pago.forma === "tarjeta" ? data.pago.tarjeta.tipo : null,
        tarjetaMarca: data.pago.forma === "tarjeta" ? data.pago.tarjeta.marca : null,
        tarjetaUltimos4: data.pago.forma === "tarjeta" ? data.pago.tarjeta.ultimos4 : null,
        estado: "emitida",
        clienteId: cliente?.id ?? null,
        usuarioId: usuario.id,
      })
      .returning();

    await tx.insert(facturaItems).values(
      itemsCalculados.map((i) => ({
        facturaId: factura.id,
        productoId: i.productoId,
        codigo: i.codigo,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.subtotal,
      })),
    );

    for (const item of itemsCalculados) {
      await moverStock(tx, {
        productoId: item.productoId,
        cantidad: -item.cantidad,
        tipo: "venta",
        motivo: "Venta",
        observacion: `Factura ${formatNumero(factura.puntoVenta, factura.numero)}`,
        facturaId: factura.id,
        usuarioId: usuario.id,
        fecha,
      });
    }

    if (data.pago.forma === "cuenta_corriente" && cliente) {
      await tx.insert(movimientosCuenta).values({
        clienteId: cliente.id,
        tipo: "debito",
        importe: total,
        descripcion: `Factura ${formatNumero(factura.puntoVenta, factura.numero)}`,
        facturaId: factura.id,
        fecha,
      });
    }

    return buildFactura(tx, factura.id);
  });
}

/** RF-V8: listado filtrado y paginado, sin renglones. */
export async function listar(usuario: AuthUser, query: URLSearchParams) {
  requireAuth(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const q = query.get("q")?.trim();
  const desde = query.get("desde");
  const hasta = query.get("hasta");
  const clienteId = Number(query.get("clienteId"));
  const vendedorId = Number(query.get("vendedorId"));
  const forma = query.get("forma");
  const estado = query.get("estado");

  const conditions: SQL[] = [];
  if (q) {
    const numero = parseNumeroFactura(q);
    if (numero) {
      // RF-V8: el usuario copia el número del comprobante (`0001-00000001`).
      conditions.push(and(eq(facturas.puntoVenta, numero.puntoVenta), eq(facturas.numero, numero.numero))!);
    } else {
      conditions.push(
        or(like(facturas.numero, `%${q.replace(/\D/g, "")}%`), like(clientes.nombre, `%${q}%`))!,
      );
    }
  }
  if (desde) conditions.push(gte(facturas.fecha, dayBoundsArg(desde).desde));
  if (hasta) conditions.push(lte(facturas.fecha, dayBoundsArg(hasta).hasta));
  if (Number.isInteger(clienteId) && clienteId > 0) conditions.push(eq(facturas.clienteId, clienteId));
  if (Number.isInteger(vendedorId) && vendedorId > 0) conditions.push(eq(facturas.usuarioId, vendedorId));
  if (forma && ["contado", "tarjeta", "cuenta_corriente"].includes(forma)) {
    conditions.push(eq(facturas.forma, forma as "contado" | "tarjeta" | "cuenta_corriente"));
  }
  if (estado && ["emitida", "anulada"].includes(estado)) {
    conditions.push(eq(facturas.estado, estado as "emitida" | "anulada"));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: facturas.id,
      puntoVenta: facturas.puntoVenta,
      numero: facturas.numero,
      fecha: facturas.fecha,
      total: facturas.total,
      forma: facturas.forma,
      estado: facturas.estado,
      clienteId: facturas.clienteId,
      clienteNombre: clientes.nombre,
      vendedorId: usuarios.id,
      vendedorNombre: usuarios.nombre,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(where)
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(limit)
    .offset(offset);

  // El count usa los MISMOS joins que la consulta de datos: `$count(facturas, where)`
  // genera una subconsulta correlacionada cuando el filtro incluye `clientes.nombre`
  // y cuenta de más (RF-V8).
  const [{ count, totalEmitido }] = await db
    .select({
      count: sql<number>`count(*)`,
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(where);

  return {
    data: rows.map((f) => ({
      id: f.id,
      numero: f.numero,
      numeroFormateado: formatNumero(f.puntoVenta, f.numero),
      fecha: f.fecha.toISOString(),
      total: f.total,
      forma: f.forma,
      estado: f.estado,
      cliente: f.clienteId ? { id: f.clienteId, nombre: f.clienteNombre } : null,
      vendedor: { id: f.vendedorId, nombre: f.vendedorNombre },
    })),
    page,
    pageSize,
    total: Number(count),
    totalEmitido: Number(totalEmitido ?? 0),
  };
}

/** RF-V7: factura completa. */
export async function obtener(usuario: AuthUser, id: number) {
  requireAuth(usuario);
  return buildFactura(db, id);
}

/** RF-V1: número informativo; el real se asigna al confirmar. */
export async function proximoNumero(usuario: AuthUser) {
  requireAuth(usuario);
  const [seq] = await db.select().from(secuencias).where(eq(secuencias.tipo, "factura")).limit(1);
  const puntoVenta = seq?.puntoVenta ?? 1;
  const ultimo = seq?.ultimo ?? 0;
  return { numeroFormateado: formatNumero(puntoVenta, ultimo + 1) };
}

/**
 * RF-V9 / reglas 5 y 12: anulación con motivo obligatorio. Reingresa stock con
 * movimientos de anulación y registra un crédito si fue a cuenta corriente.
 * La factura queda visible como Anulada; nunca se borra.
 */
export async function anular(usuario: AuthUser, id: number, input: unknown) {
  requireAdmin(usuario);
  const data = parseOrThrow(anularFacturaSchema, input);

  return db.transaction(async (tx) => {
    const [factura] = await tx.select().from(facturas).where(eq(facturas.id, id)).limit(1);
    if (!factura) throw err.noEncontrado("La factura");
    if (factura.estado === "anulada") {
      throw err.duplicado("FACTURA_ANULADA", "La factura ya estaba anulada.");
    }

    const fecha = new Date();
    await tx
      .update(facturas)
      .set({
        estado: "anulada",
        motivoAnulacion: data.motivo,
        anulacionFecha: fecha,
        anulacionUsuarioId: usuario.id,
      })
      .where(eq(facturas.id, id));

    const items = await tx.select().from(facturaItems).where(eq(facturaItems.facturaId, id));
    for (const item of items) {
      await moverStock(tx, {
        productoId: item.productoId,
        cantidad: item.cantidad,
        tipo: "anulacion",
        motivo: `Anulación: ${data.motivo}`,
        observacion: `Factura ${formatNumero(factura.puntoVenta, factura.numero)}`,
        facturaId: id,
        usuarioId: usuario.id,
        fecha,
      });
    }

    if (factura.forma === "cuenta_corriente" && factura.clienteId) {
      // Regla 8: si la factura ya estaba pagada, acreditar el total dejaría
      // saldo a favor. Se revierte sólo la deuda aún pendiente (RF-V9).
      const saldo = await getSaldo(factura.clienteId, tx);
      const importe = Math.min(factura.total, Math.max(saldo, 0));
      if (importe > 0) {
        await tx.insert(movimientosCuenta).values({
          clienteId: factura.clienteId,
          tipo: "credito",
          importe,
          descripcion: `Anulación Factura ${formatNumero(factura.puntoVenta, factura.numero)}`,
          facturaId: id,
          fecha,
        });
      }
    }

    return buildFactura(tx, id);
  });
}
