import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Regla 10: los importes se guardan como enteros en centavos. */

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "vendedor"] }).notNull().default("vendedor"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const productos = sqliteTable(
  "productos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codigo: text("codigo").notNull().unique(),
    descripcion: text("descripcion").notNull(),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id),
    precio: integer("precio").notNull(),
    existencia: integer("existencia").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("productos_categoria_idx").on(t.categoriaId)],
);

export const facturas = sqliteTable(
  "facturas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puntoVenta: integer("punto_venta").notNull().default(1),
    numero: integer("numero").notNull(),
    fecha: integer("fecha", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    total: integer("total").notNull(),
    forma: text("forma", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
    montoRecibido: integer("monto_recibido"),
    tarjetaTipo: text("tarjeta_tipo"),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    estado: text("estado", { enum: ["emitida", "anulada"] }).notNull().default("emitida"),
    motivoAnulacion: text("motivo_anulacion"),
    anulacionFecha: integer("anulacion_fecha", { mode: "timestamp" }),
    anulacionUsuarioId: integer("anulacion_usuario_id").references(() => usuarios.id),
    clienteId: integer("cliente_id").references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("facturas_numero_idx").on(t.puntoVenta, t.numero),
    index("facturas_fecha_idx").on(t.fecha),
    index("facturas_cliente_idx").on(t.clienteId),
  ],
);

export const facturaItems = sqliteTable(
  "factura_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    facturaId: integer("factura_id")
      .notNull()
      .references(() => facturas.id),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    codigo: text("codigo").notNull(),
    descripcion: text("descripcion").notNull(),
    cantidad: integer("cantidad").notNull(),
    precioUnitario: integer("precio_unitario").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("factura_items_factura_idx").on(t.facturaId)],
);

export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: text("tipo", { enum: ["venta", "anulacion", "ingreso", "egreso"] }).notNull(),
    cantidad: integer("cantidad").notNull(),
    existenciaResultante: integer("existencia_resultante").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    facturaId: integer("factura_id").references(() => facturas.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    createdAt: createdAt(),
  },
  (t) => [index("movimientos_stock_producto_idx").on(t.productoId)],
);

export const clientes = sqliteTable(
  "clientes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
    nroDoc: text("nro_doc").notNull().unique(),
    nombre: text("nombre").notNull(),
    domicilio: text("domicilio"),
    telefono: text("telefono"),
    email: text("email"),
    cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" })
      .notNull()
      .default(false),
    limiteCredito: integer("limite_credito"),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("clientes_nombre_idx").on(t.nombre)],
);

export const pagos = sqliteTable(
  "pagos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    numeroRecibo: integer("numero_recibo").notNull().unique(),
    fecha: integer("fecha", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    importe: integer("importe").notNull(),
    medio: text("medio", { enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
    observacion: text("observacion"),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    createdAt: createdAt(),
  },
  (t) => [index("pagos_cliente_idx").on(t.clienteId)],
);

export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipo: text("tipo", { enum: ["debito", "credito"] }).notNull(),
    importe: integer("importe").notNull(),
    fecha: integer("fecha", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    descripcion: text("descripcion").notNull(),
    facturaId: integer("factura_id").references(() => facturas.id),
    pagoId: integer("pago_id").references(() => pagos.id),
    createdAt: createdAt(),
  },
  (t) => [index("movimientos_cuenta_cliente_idx").on(t.clienteId)],
);

/** Regla 4: numeración correlativa y sin huecos. Una fila por secuencia. */
export const secuencias = sqliteTable("secuencias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo", { enum: ["factura", "recibo"] }).notNull().unique(),
  ultimo: integer("ultimo").notNull().default(0),
  puntoVenta: integer("punto_venta").notNull().default(1),
});

export type Rol = "admin" | "vendedor";
export type AuthUser = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
};
