// Esquema de datos (sección 7 de requerimientos).
// Convenciones:
// - Todas las tablas llevan `id` entero autoincremental y `creadoEn`.
// - Importes en centavos como enteros, nunca coma flotante (regla 10).
// - Bajas lógicas con `activo`/`activa`: nada con historial se borra (regla 12).
// - Facturas, movimientos y pagos guardan usuario y fecha (regla 11).
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Valores de dominio compartidos con los esquemas Zod y la interfaz.
export const ROLES = ["admin", "vendedor"] as const;
export const TIPOS_MOVIMIENTO_STOCK = ["venta", "anulacion", "ingreso", "egreso"] as const;
export const TIPOS_DOCUMENTO = ["DNI", "CUIT"] as const;
export const FORMAS_PAGO = ["contado", "tarjeta", "cuenta_corriente"] as const;
export const TIPOS_TARJETA = ["debito", "credito"] as const;
export const ESTADOS_FACTURA = ["emitida", "anulada"] as const;
export const MEDIOS_PAGO = ["efectivo", "transferencia", "tarjeta_debito"] as const;
export const TIPOS_MOVIMIENTO_CUENTA = ["debito", "credito"] as const;

// Fecha y hora guardadas como milisegundos UTC; Drizzle las expone como Date.
const fechaHora = (nombre: string) => integer(nombre, { mode: "timestamp_ms" });
const creadoEn = () =>
  fechaHora("creado_en")
    .notNull()
    .$defaultFn(() => new Date());
const booleano = (nombre: string) => integer(nombre, { mode: "boolean" });

// ─── Usuarios (RF-U1 a RF-U5) ────────────────────────────────────────────────
export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ROLES }).notNull(),
  activo: booleano("activo").notNull().default(true),
  creadoEn: creadoEn(),
});

// ─── Categorías (RF-P7) ─────────────────────────────────────────────────────
export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activa: booleano("activa").notNull().default(true),
  creadoEn: creadoEn(),
});

// ─── Productos (RF-P1 a RF-P3) ──────────────────────────────────────────────
// `existencia` solo cambia en moverStock() (sección 10.2). El CHECK es una
// última barrera en la base para la regla 1: nunca negativa.
export const productos = sqliteTable(
  "productos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codigo: text("codigo").notNull().unique(),
    descripcion: text("descripcion").notNull(),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id),
    precio: integer("precio").notNull(), // centavos
    existencia: integer("existencia").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    activo: booleano("activo").notNull().default(true),
    creadoEn: creadoEn(),
  },
  (t) => [
    index("productos_categoria_idx").on(t.categoriaId),
    check("productos_existencia_no_negativa", sql`${t.existencia} >= 0`),
    check("productos_precio_no_negativo", sql`${t.precio} >= 0`),
    check("productos_stock_minimo_no_negativo", sql`${t.stockMinimo} >= 0`),
  ],
);

// ─── Clientes (RF-C1, RF-C2, RF-C7) ─────────────────────────────────────────
// `nroDoc` se guarda normalizado (solo dígitos); el formato con puntos o
// guiones lo pone el módulo de formatos. El saldo NO se guarda: se deriva de
// movimientos_cuenta (regla 7, sección 10.2).
export const clientes = sqliteTable(
  "clientes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tipoDoc: text("tipo_doc", { enum: TIPOS_DOCUMENTO }).notNull(),
    nroDoc: text("nro_doc").notNull(),
    nombre: text("nombre").notNull(),
    domicilio: text("domicilio"),
    telefono: text("telefono"),
    email: text("email"),
    cuentaCorriente: booleano("cuenta_corriente").notNull().default(false),
    limiteCredito: integer("limite_credito"), // centavos; null = sin límite
    activo: booleano("activo").notNull().default(true),
    creadoEn: creadoEn(),
  },
  (t) => [
    uniqueIndex("clientes_documento_uq").on(t.tipoDoc, t.nroDoc),
    index("clientes_nombre_idx").on(t.nombre),
    check(
      "clientes_limite_no_negativo",
      sql`${t.limiteCredito} IS NULL OR ${t.limiteCredito} >= 0`,
    ),
  ],
);

// ─── Facturas (RF-V1 a RF-V9) ───────────────────────────────────────────────
// Numeración correlativa por punto de venta (regla 4). Cliente nulo =
// consumidor final. De la tarjeta solo tipo, marca y últimos 4 (regla 9).
export const facturas = sqliteTable(
  "facturas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puntoVenta: integer("punto_venta").notNull().default(1),
    numero: integer("numero").notNull(),
    fecha: fechaHora("fecha").notNull(),
    clienteId: integer("cliente_id").references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    total: integer("total").notNull(), // centavos
    formaPago: text("forma_pago", { enum: FORMAS_PAGO }).notNull(),
    tarjetaTipo: text("tarjeta_tipo", { enum: TIPOS_TARJETA }),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    montoRecibido: integer("monto_recibido"), // centavos; solo contado
    estado: text("estado", { enum: ESTADOS_FACTURA }).notNull().default("emitida"),
    motivoAnulacion: text("motivo_anulacion"),
    anuladaEn: fechaHora("anulada_en"),
    anuladaPorId: integer("anulada_por_id").references(() => usuarios.id),
    creadoEn: creadoEn(),
  },
  (t) => [
    uniqueIndex("facturas_numero_uq").on(t.puntoVenta, t.numero),
    index("facturas_fecha_idx").on(t.fecha),
    index("facturas_cliente_idx").on(t.clienteId),
    index("facturas_usuario_idx").on(t.usuarioId),
    check("facturas_total_no_negativo", sql`${t.total} >= 0`),
    check(
      "facturas_ultimos4",
      sql`${t.tarjetaUltimos4} IS NULL OR (length(${t.tarjetaUltimos4}) = 4 AND ${t.tarjetaUltimos4} NOT GLOB '*[^0-9]*')`,
    ),
    // Regla 6: consumidor final no compra en cuenta corriente.
    check(
      "facturas_cc_requiere_cliente",
      sql`${t.formaPago} <> 'cuenta_corriente' OR ${t.clienteId} IS NOT NULL`,
    ),
  ],
);

// ─── Renglones de factura (RF-V3, regla 3) ──────────────────────────────────
// Código, descripción y precio se copian del catálogo al confirmar: cambiar el
// catálogo no altera facturas emitidas.
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
    precioUnitario: integer("precio_unitario").notNull(), // centavos
    subtotal: integer("subtotal").notNull(), // centavos
    creadoEn: creadoEn(),
  },
  (t) => [
    // Un producto aparece una sola vez por factura (sección 11.6).
    uniqueIndex("factura_items_producto_uq").on(t.facturaId, t.productoId),
    index("factura_items_producto_idx").on(t.productoId),
    check("factura_items_cantidad_positiva", sql`${t.cantidad} > 0`),
  ],
);

// ─── Movimientos de stock (RF-P4 a RF-P6, regla 2) ──────────────────────────
// `cantidad` lleva signo (+ ingreso/anulación, − venta/egreso). La suma de
// movimientos de un producto debe dar su existencia.
export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    facturaId: integer("factura_id").references(() => facturas.id),
    tipo: text("tipo", { enum: TIPOS_MOVIMIENTO_STOCK }).notNull(),
    cantidad: integer("cantidad").notNull(),
    existenciaResultante: integer("existencia_resultante").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    fecha: fechaHora("fecha").notNull(),
    creadoEn: creadoEn(),
  },
  (t) => [
    index("movimientos_stock_producto_fecha_idx").on(t.productoId, t.fecha),
    index("movimientos_stock_factura_idx").on(t.facturaId),
    index("movimientos_stock_fecha_idx").on(t.fecha),
    check("movimientos_stock_cantidad_no_cero", sql`${t.cantidad} <> 0`),
    check("movimientos_stock_resultante_no_negativa", sql`${t.existenciaResultante} >= 0`),
  ],
);

// ─── Pagos de cuenta corriente (RF-C5) ──────────────────────────────────────
// Numeración de recibos propia, separada de la de facturas (regla 4).
export const pagos = sqliteTable(
  "pagos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puntoVenta: integer("punto_venta").notNull().default(1),
    numero: integer("numero").notNull(),
    fecha: fechaHora("fecha").notNull(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    importe: integer("importe").notNull(), // centavos
    medio: text("medio", { enum: MEDIOS_PAGO }).notNull(),
    observacion: text("observacion"),
    creadoEn: creadoEn(),
  },
  (t) => [
    uniqueIndex("pagos_recibo_uq").on(t.puntoVenta, t.numero),
    index("pagos_cliente_idx").on(t.clienteId),
    check("pagos_importe_positivo", sql`${t.importe} > 0`),
  ],
);

// ─── Movimientos de cuenta corriente (RF-C4, regla 7) ───────────────────────
// Única fuente del saldo: débitos − créditos. `importe` siempre positivo; el
// sentido lo da `tipo`. Origen: una factura (débito o crédito por anulación)
// o un pago (crédito).
export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipo: text("tipo", { enum: TIPOS_MOVIMIENTO_CUENTA }).notNull(),
    importe: integer("importe").notNull(), // centavos
    fecha: fechaHora("fecha").notNull(),
    descripcion: text("descripcion").notNull(),
    facturaId: integer("factura_id").references(() => facturas.id),
    pagoId: integer("pago_id").references(() => pagos.id),
    creadoEn: creadoEn(),
  },
  (t) => [
    index("movimientos_cuenta_cliente_fecha_idx").on(t.clienteId, t.fecha),
    index("movimientos_cuenta_factura_idx").on(t.facturaId),
    index("movimientos_cuenta_pago_idx").on(t.pagoId),
    check("movimientos_cuenta_importe_positivo", sql`${t.importe} > 0`),
    check(
      "movimientos_cuenta_un_origen",
      sql`(${t.facturaId} IS NULL) <> (${t.pagoId} IS NULL)`,
    ),
  ],
);

// ─── Relaciones (para consultas con `db.query`) ─────────────────────────────
export const usuariosRelations = relations(usuarios, ({ many }) => ({
  facturas: many(facturas, { relationName: "vendedor" }),
  movimientosStock: many(movimientosStock),
  pagos: many(pagos),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  categoria: one(categorias, { fields: [productos.categoriaId], references: [categorias.id] }),
  movimientos: many(movimientosStock),
  items: many(facturaItems),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  facturas: many(facturas),
  pagos: many(pagos),
  movimientosCuenta: many(movimientosCuenta),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  cliente: one(clientes, { fields: [facturas.clienteId], references: [clientes.id] }),
  vendedor: one(usuarios, {
    fields: [facturas.usuarioId],
    references: [usuarios.id],
    relationName: "vendedor",
  }),
  anuladaPor: one(usuarios, {
    fields: [facturas.anuladaPorId],
    references: [usuarios.id],
    relationName: "anuladaPor",
  }),
  items: many(facturaItems),
  movimientosStock: many(movimientosStock),
  movimientosCuenta: many(movimientosCuenta),
}));

export const facturaItemsRelations = relations(facturaItems, ({ one }) => ({
  factura: one(facturas, { fields: [facturaItems.facturaId], references: [facturas.id] }),
  producto: one(productos, { fields: [facturaItems.productoId], references: [productos.id] }),
}));

export const movimientosStockRelations = relations(movimientosStock, ({ one }) => ({
  producto: one(productos, { fields: [movimientosStock.productoId], references: [productos.id] }),
  usuario: one(usuarios, { fields: [movimientosStock.usuarioId], references: [usuarios.id] }),
  factura: one(facturas, { fields: [movimientosStock.facturaId], references: [facturas.id] }),
}));

export const pagosRelations = relations(pagos, ({ one, many }) => ({
  cliente: one(clientes, { fields: [pagos.clienteId], references: [clientes.id] }),
  usuario: one(usuarios, { fields: [pagos.usuarioId], references: [usuarios.id] }),
  movimientosCuenta: many(movimientosCuenta),
}));

export const movimientosCuentaRelations = relations(movimientosCuenta, ({ one }) => ({
  cliente: one(clientes, { fields: [movimientosCuenta.clienteId], references: [clientes.id] }),
  factura: one(facturas, { fields: [movimientosCuenta.facturaId], references: [facturas.id] }),
  pago: one(pagos, { fields: [movimientosCuenta.pagoId], references: [pagos.id] }),
}));

// ─── Tipos inferidos ────────────────────────────────────────────────────────
export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Rol = (typeof ROLES)[number];
export type Categoria = typeof categorias.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type MovimientoStock = typeof movimientosStock.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
export type FacturaItem = typeof facturaItems.$inferSelect;
export type Pago = typeof pagos.$inferSelect;
export type MovimientoCuenta = typeof movimientosCuenta.$inferSelect;
