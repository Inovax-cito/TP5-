import { and, asc, desc, eq, like, lt, lte, gte, ne, or, sql, type SQL } from "drizzle-orm";
import { getPagination } from "@/lib/api/pagination";
import { requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { clientes, facturas, movimientosCuenta, type AuthUser } from "@/lib/db/schema";
import { ApiError, err } from "@/lib/errors";
import { dayBoundsArg, formatNumero, normalizeDoc } from "@/lib/format";
import { parseOrThrow } from "@/lib/validations/parse";
import { actualizarClienteSchema, crearClienteSchema } from "@/lib/validations/clientes";
import { saldoExpr } from "./saldos";

const seleccion = {
  id: clientes.id,
  tipoDoc: clientes.tipoDoc,
  nroDoc: clientes.nroDoc,
  nombre: clientes.nombre,
  domicilio: clientes.domicilio,
  telefono: clientes.telefono,
  email: clientes.email,
  cuentaCorriente: clientes.cuentaCorriente,
  limiteCredito: clientes.limiteCredito,
  activo: clientes.activo,
  saldo: saldoExpr,
};

type ClienteRow = {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  activo: boolean;
  saldo: number | SQL<number>;
};

function publico(row: ClienteRow) {
  const saldo = Number(row.saldo ?? 0);
  return {
    ...row,
    saldo,
    disponible: row.limiteCredito === null ? null : row.limiteCredito - saldo,
  };
}

/** RF-C2: compara documentos sin puntos, guiones ni espacios (28.456.123 = 28456123). */
function docNormalizadoSQL() {
  return sql<string>`replace(replace(replace(lower(${clientes.nroDoc}), '.', ''), '-', ''), ' ', '')`;
}

/** RF-C1 / RF-C6: búsqueda por nombre o documento, con saldo calculado. */
export async function listar(usuario: AuthUser, query: URLSearchParams) {
  requireAuth(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const q = query.get("q")?.trim();
  const conDeuda = query.get("conDeuda") === "true";
  const orden = query.get("orden");

  const conditions: SQL[] = [];
  if (q) {
    conditions.push(
      or(like(clientes.nombre, `%${q}%`), like(docNormalizadoSQL(), `%${normalizeDoc(q)}%`))!,
    );
  }
  if (conDeuda) conditions.push(sql`(${saldoExpr}) > 0`);
  const where = conditions.length ? and(...conditions) : undefined;

  const order = orden === "saldo" ? [desc(saldoExpr), asc(clientes.nombre)] : [asc(clientes.nombre)];
  const rows = await db
    .select(seleccion)
    .from(clientes)
    .where(where)
    .orderBy(...order)
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: db.$count(clientes, where) })
    .from(clientes);

  const result: {
    data: ReturnType<typeof publico>[];
    page: number;
    pageSize: number;
    total: number;
    totalAdeudado?: number;
  } = { data: rows.map(publico), page, pageSize, total: Number(count) };

  if (conDeuda) {
    const [{ total }] = await db
      .select({ total: sql<number>`coalesce(sum(${saldoExpr}), 0)` })
      .from(clientes)
      .where(where);
    result.totalAdeudado = Number(total ?? 0);
  }
  return result;
}

/** RF-C3: ficha con saldo, disponible y últimas facturas. */
export async function obtener(usuario: AuthUser, id: number) {
  requireAuth(usuario);
  const [row] = await db.select(seleccion).from(clientes).where(eq(clientes.id, id)).limit(1);
  if (!row) throw err.noEncontrado("El cliente");

  const ultimas = await db
    .select({
      id: facturas.id,
      numero: facturas.numero,
      puntoVenta: facturas.puntoVenta,
      fecha: facturas.fecha,
      total: facturas.total,
      estado: facturas.estado,
      forma: facturas.forma,
    })
    .from(facturas)
    .where(eq(facturas.clienteId, id))
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(6);

  return {
    ...publico(row),
    ultimasFacturas: ultimas.map((f) => ({
      ...f,
      numeroFormateado: formatNumero(f.puntoVenta, f.numero),
      fecha: f.fecha.toISOString(),
    })),
  };
}

/** RF-C2 / RF-V2: alta (también desde el modal de Nueva venta). */
export async function crear(usuario: AuthUser, input: unknown) {
  requireAuth(usuario);
  const data = parseOrThrow(crearClienteSchema, input);
  const nroDoc = data.nroDoc.trim();

  const existe = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(docNormalizadoSQL(), normalizeDoc(nroDoc)))
    .limit(1);
  if (existe.length) throw err.duplicado("DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento.");

  const [row] = await db
    .insert(clientes)
    .values({
      tipoDoc: data.tipoDoc,
      nroDoc,
      nombre: data.nombre,
      domicilio: data.domicilio,
      telefono: data.telefono,
      email: data.email,
      cuentaCorriente: data.cuentaCorriente,
      limiteCredito: data.limiteCredito ?? null,
      activo: true,
    })
    .returning();

  return publico({ ...row, saldo: 0 });
}

/** RF-C2 / RF-C7: edición y baja lógica con saldo pendiente. */
export async function actualizar(usuario: AuthUser, id: number, input: unknown) {
  requireAuth(usuario);
  const data = parseOrThrow(actualizarClienteSchema, input);

  if (data.nroDoc !== undefined) {
    const existe = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(and(eq(docNormalizadoSQL(), normalizeDoc(data.nroDoc)), ne(clientes.id, id)))
      .limit(1);
    if (existe.length) throw err.duplicado("DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento.");
  }

  const [actual] = await db.select(seleccion).from(clientes).where(eq(clientes.id, id)).limit(1);
  if (!actual) throw err.noEncontrado("El cliente");

  if (
    (data.activo === false || data.cuentaCorriente === false) &&
    Number(actual.saldo ?? 0) !== 0
  ) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "El cliente tiene saldo pendiente: regularizalo antes de darlo de baja o quitarle la cuenta corriente.",
    );
  }

  const [row] = await db
    .update(clientes)
    .set({
      ...(data.tipoDoc !== undefined ? { tipoDoc: data.tipoDoc } : {}),
      ...(data.nroDoc !== undefined ? { nroDoc: data.nroDoc.trim() } : {}),
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.domicilio !== undefined ? { domicilio: data.domicilio } : {}),
      ...(data.telefono !== undefined ? { telefono: data.telefono } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.cuentaCorriente !== undefined ? { cuentaCorriente: data.cuentaCorriente } : {}),
      ...(data.limiteCredito !== undefined ? { limiteCredito: data.limiteCredito } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(clientes.id, id))
    .returning({ id: clientes.id });

  if (!row) throw err.noEncontrado("El cliente");
  return obtener(usuario, id);
}

/** RF-C4: cuenta corriente con saldo acumulado en cada renglón. */
export async function cuenta(usuario: AuthUser, id: number, query: URLSearchParams) {
  requireAuth(usuario);
  const [cliente] = await db.select(seleccion).from(clientes).where(eq(clientes.id, id)).limit(1);
  if (!cliente) throw err.noEncontrado("El cliente");

  const desde = query.get("desde");
  const hasta = query.get("hasta");
  const conditions: SQL[] = [eq(movimientosCuenta.clienteId, id)];
  if (desde) conditions.push(gte(movimientosCuenta.fecha, dayBoundsArg(desde).desde));
  if (hasta) conditions.push(lte(movimientosCuenta.fecha, dayBoundsArg(hasta).hasta));

  const rows = await db
    .select({
      id: movimientosCuenta.id,
      fecha: movimientosCuenta.fecha,
      tipo: movimientosCuenta.tipo,
      importe: movimientosCuenta.importe,
      descripcion: movimientosCuenta.descripcion,
      facturaId: movimientosCuenta.facturaId,
      pagoId: movimientosCuenta.pagoId,
    })
    .from(movimientosCuenta)
    .where(and(...conditions))
    .orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id));

  let saldoAnterior = 0;
  if (desde) {
    const limite = dayBoundsArg(desde).desde;
    const [previo] = await db
      .select({
        saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito'
          then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
      })
      .from(movimientosCuenta)
      .where(and(eq(movimientosCuenta.clienteId, id), lt(movimientosCuenta.fecha, limite)));
    saldoAnterior = Number(previo?.saldo ?? 0);
  }

  let saldo = saldoAnterior;
  const movimientos = rows.map((row) => {
    saldo += row.tipo === "debito" ? row.importe : -row.importe;
    return {
      fecha: row.fecha.toISOString(),
      tipo: row.tipo,
      importe: row.importe,
      descripcion: row.descripcion,
      facturaId: row.facturaId,
      pagoId: row.pagoId,
      saldo,
    };
  });

  return {
    cliente: { id: cliente.id, nombre: cliente.nombre },
    saldoAnterior,
    movimientos,
    saldo,
  };
}
