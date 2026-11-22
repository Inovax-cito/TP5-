import { and, desc, eq, gte, lte, like, sql, type SQL } from "drizzle-orm";
import { getPagination } from "@/lib/api/pagination";
import { boolParam, intParam } from "@/lib/api/pagination";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { categorias, facturas, movimientosStock, productos, usuarios } from "@/lib/db/schema";
import type { AuthUser } from "@/lib/db/schema";
import { err } from "@/lib/errors";
import { dayBoundsArg } from "@/lib/format";
import { parseOrThrow } from "@/lib/validations/parse";
import {
  actualizarProductoSchema,
  crearProductoSchema,
  movimientoStockSchema,
} from "@/lib/validations/productos";
import { moverStock } from "./stock.service";

const seleccion = {
  id: productos.id,
  codigo: productos.codigo,
  descripcion: productos.descripcion,
  imagen: productos.imagen,
  categoriaId: categorias.id,
  categoriaNombre: categorias.nombre,
  precio: productos.precio,
  existencia: productos.existencia,
  stockMinimo: productos.stockMinimo,
  bajoMinimo: sql<boolean>`${productos.existencia} < ${productos.stockMinimo}`,
  activo: productos.activo,
};

type ProductoRow = {
  id: number;
  codigo: string;
  descripcion: string;
  imagen: string | null;
  categoriaId: number;
  categoriaNombre: string;
  precio: number;
  existencia: number;
  stockMinimo: number;
  bajoMinimo: boolean | SQL<boolean>;
  activo: boolean;
};

function publico(row: ProductoRow) {
  return {
    id: row.id,
    codigo: row.codigo,
    descripcion: row.descripcion,
    imagen: row.imagen,
    categoria: { id: row.categoriaId, nombre: row.categoriaNombre },
    precio: row.precio,
    existencia: row.existencia,
    stockMinimo: row.stockMinimo,
    bajoMinimo: Boolean(row.bajoMinimo),
    activo: row.activo,
  };
}

/** RF-P1: catálogo paginado con búsqueda, categoría, bajo mínimo y activos. */
export async function listar(usuario: AuthUser, query: URLSearchParams) {
  requireAuth(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const q = query.get("q")?.trim();
  const categoriaId = intParam(query.get("categoriaId"));
  const bajoMinimo = boolParam(query.get("bajoMinimo"));
  const activoParam = query.get("activo");

  const conditions: SQL[] = [];
  if (q) {
    conditions.push(
      sql`(${like(productos.codigo, `%${q}%`)} or ${like(productos.descripcion, `%${q}%`)})`,
    );
  }
  if (categoriaId) conditions.push(eq(productos.categoriaId, categoriaId));
  if (bajoMinimo) conditions.push(sql`${productos.existencia} < ${productos.stockMinimo}`);
  if (activoParam === "todos") {
    // El administrador puede pedir todos; el vendedor solo ve los activos.
    if (usuario.rol !== "admin") conditions.push(eq(productos.activo, true));
  } else if (activoParam === "false") {
    if (usuario.rol !== "admin") conditions.push(eq(productos.activo, true));
    else conditions.push(eq(productos.activo, false));
  } else {
    conditions.push(eq(productos.activo, true));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select(seleccion)
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(where)
    .orderBy(productos.descripcion)
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: db.$count(productos, where) })
    .from(productos);

  return { data: rows.map(publico), page, pageSize, total: Number(count) };
}

/** RF-P1: ficha del producto. */
export async function obtener(usuario: AuthUser, id: number) {
  requireAuth(usuario);
  const [row] = await db
    .select(seleccion)
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, id))
    .limit(1);
  if (!row) throw err.noEncontrado("El producto");
  return publico(row);
}

/** RF-P2: alta. El stock inicial se graba como movimiento de ingreso (RF-P4). */
export async function crear(usuario: AuthUser, input: unknown) {
  requireAdmin(usuario);
  const data = parseOrThrow(crearProductoSchema, input);

  const existe = await db
    .select({ id: productos.id })
    .from(productos)
    .where(eq(productos.codigo, data.codigo))
    .limit(1);
  if (existe.length) throw err.duplicado("CODIGO_DUPLICADO", "Ya existe un producto con ese código.");

  const [categoria] = await db
    .select({ id: categorias.id, nombre: categorias.nombre })
    .from(categorias)
    .where(eq(categorias.id, data.categoriaId))
    .limit(1);
  if (!categoria) throw err.noEncontrado("La categoría");

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(productos)
      .values({
        codigo: data.codigo,
        descripcion: data.descripcion,
        imagen: data.imagen || null,
        categoriaId: data.categoriaId,
        precio: data.precio,
        stockMinimo: data.stockMinimo,
        activo: true,
        existencia: 0,
      })
      .returning();

    if (data.stockInicial && data.stockInicial > 0) {
      await moverStock(tx, {
        productoId: row.id,
        cantidad: data.stockInicial,
        tipo: "ingreso",
        motivo: "Stock inicial",
        observacion: "Carga inicial del catálogo",
        usuarioId: usuario.id,
      });
    }

    const existencia = data.stockInicial ?? 0;
    return {
      id: row.id,
      codigo: row.codigo,
      descripcion: row.descripcion,
      imagen: row.imagen,
      categoria: { id: categoria.id, nombre: categoria.nombre },
      precio: row.precio,
      existencia,
      stockMinimo: row.stockMinimo,
      bajoMinimo: existencia < row.stockMinimo,
      activo: row.activo,
    };
  });
}

/** RF-P2 y RF-P3: edición y baja lógica. `existencia` se rechaza por .strict(). */
export async function actualizar(usuario: AuthUser, id: number, input: unknown) {
  requireAdmin(usuario);
  const data = parseOrThrow(actualizarProductoSchema, input);

  if (data.codigo !== undefined) {
    const existe = await db
      .select({ id: productos.id })
      .from(productos)
      .where(and(eq(productos.codigo, data.codigo), sql`${productos.id} <> ${id}`))
      .limit(1);
    if (existe.length) throw err.duplicado("CODIGO_DUPLICADO", "Ya existe un producto con ese código.");
  }
  if (data.categoriaId !== undefined) {
    const [categoria] = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(eq(categorias.id, data.categoriaId))
      .limit(1);
    if (!categoria) throw err.noEncontrado("La categoría");
  }

  const [row] = await db
    .update(productos)
    .set({
      ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.imagen !== undefined ? { imagen: data.imagen || null } : {}),
      ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
      ...(data.precio !== undefined ? { precio: data.precio } : {}),
      ...(data.stockMinimo !== undefined ? { stockMinimo: data.stockMinimo } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(productos.id, id))
    .returning({ id: productos.id });

  if (!row) throw err.noEncontrado("El producto");
  return obtener(usuario, id);
}

function movimientoPublico(row: {
  id: number;
  tipo: string;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  observacion: string | null;
  fecha: Date;
  facturaId: number | null;
  numeroFactura: number | null;
  puntoVenta: number | null;
  usuarioId: number;
  usuarioNombre: string;
}) {
  return {
    id: row.id,
    tipo: row.tipo,
    cantidad: row.cantidad,
    existenciaResultante: row.existenciaResultante,
    motivo: row.motivo,
    observacion: row.observacion,
    fecha: row.fecha.toISOString(),
    referencia:
      row.facturaId !== null && row.numeroFactura !== null
        ? {
            facturaId: row.facturaId,
            numero: `${String(row.puntoVenta ?? 1).padStart(4, "0")}-${String(row.numeroFactura).padStart(8, "0")}`,
          }
        : null,
    usuario: { id: row.usuarioId, nombre: row.usuarioNombre },
  };
}

const seleccionMovimiento = {
  id: movimientosStock.id,
  tipo: movimientosStock.tipo,
  cantidad: movimientosStock.cantidad,
  existenciaResultante: movimientosStock.existenciaResultante,
  motivo: movimientosStock.motivo,
  observacion: movimientosStock.observacion,
  fecha: movimientosStock.createdAt,
  facturaId: facturas.id,
  numeroFactura: facturas.numero,
  puntoVenta: facturas.puntoVenta,
  usuarioId: usuarios.id,
  usuarioNombre: usuarios.nombre,
};

function movimientosQuery() {
  return db
    .select(seleccionMovimiento)
    .from(movimientosStock)
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id));
}

/** RF-P6: historial de un producto, del más nuevo al más viejo. */
export async function movimientos(usuario: AuthUser, productoId: number, query: URLSearchParams) {
  requireAuth(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const [producto] = await db.select({ id: productos.id }).from(productos).where(eq(productos.id, productoId)).limit(1);
  if (!producto) throw err.noEncontrado("El producto");

  const rows = await movimientosQuery()
    .where(eq(movimientosStock.productoId, productoId))
    .orderBy(desc(movimientosStock.createdAt), desc(movimientosStock.id))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: db.$count(movimientosStock, eq(movimientosStock.productoId, productoId)) })
    .from(movimientosStock);

  return {
    data: rows.map(movimientoPublico),
    page,
    pageSize,
    total: Number(count),
  };
}

/** RF-P6: movimientos de todos los productos con filtros. */
export async function movimientosGenerales(usuario: AuthUser, query: URLSearchParams) {
  requireAuth(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const conditions: SQL[] = [];
  const productoId = intParam(query.get("productoId"));
  const tipo = query.get("tipo");
  const desde = query.get("desde");
  const hasta = query.get("hasta");

  if (productoId) conditions.push(eq(movimientosStock.productoId, productoId));
  if (tipo && ["venta", "anulacion", "ingreso", "egreso"].includes(tipo)) {
    conditions.push(eq(movimientosStock.tipo, tipo as "venta" | "anulacion" | "ingreso" | "egreso"));
  }
  if (desde) conditions.push(gte(movimientosStock.createdAt, dayBoundsArg(desde).desde));
  if (hasta) conditions.push(lte(movimientosStock.createdAt, dayBoundsArg(hasta).hasta));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await movimientosQuery()
    .where(where)
    .orderBy(desc(movimientosStock.createdAt), desc(movimientosStock.id))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: db.$count(movimientosStock, where) })
    .from(movimientosStock);

  return { data: rows.map(movimientoPublico), page, pageSize, total: Number(count) };
}

/** RF-P4 / RF-P5: ingreso o egreso manual en una sola transacción. */
export async function registrarMovimiento(usuario: AuthUser, productoId: number, input: unknown) {
  requireAdmin(usuario);
  const data = parseOrThrow(movimientoStockSchema, input);

  const [producto] = await db.select({ id: productos.id }).from(productos).where(eq(productos.id, productoId)).limit(1);
  if (!producto) throw err.noEncontrado("El producto");

  return db.transaction(async (tx) => {
    const movimiento = await moverStock(tx, {
      productoId,
      cantidad: data.tipo === "ingreso" ? data.cantidad : -data.cantidad,
      tipo: data.tipo,
      motivo: data.motivo,
      observacion: data.observacion,
      usuarioId: usuario.id,
    });
    if (!movimiento) throw err.validacion("No se registró ningún movimiento.");

    const [row] = await tx
      .select(seleccionMovimiento)
      .from(movimientosStock)
      .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
      .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id))
      .where(eq(movimientosStock.id, movimiento.id))
      .limit(1);

    return {
      ...movimientoPublico(row),
      producto: { id: productoId },
    };
  });
}
