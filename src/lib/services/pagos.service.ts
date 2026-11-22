import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { clientes, movimientosCuenta, pagos, usuarios, type AuthUser } from "@/lib/db/schema";
import { ApiError, err } from "@/lib/errors";
import { formatRecibo } from "@/lib/format";
import { parseOrThrow } from "@/lib/validations/parse";
import { registrarPagoSchema } from "@/lib/validations/clientes";
import { getSaldo, getSaldoHasta, nextSecuencia } from "./saldos";

const PUNTO_VENTA_RECIBOS = 1;

type FilaRecibo = {
  id: number;
  numeroRecibo: number;
  fecha: Date;
  importe: number;
  medio: typeof pagos.$inferSelect.medio;
  observacion: string | null;
  clienteId: number;
  clienteNombre: string;
  usuarioId: number;
  usuarioNombre: string;
};

function publico(row: FilaRecibo, saldoCliente: number | null = null) {
  return {
    id: row.id,
    numeroRecibo: formatRecibo(PUNTO_VENTA_RECIBOS, row.numeroRecibo),
    fecha: row.fecha.toISOString(),
    cliente: { id: row.clienteId, nombre: row.clienteNombre },
    importe: row.importe,
    medio: row.medio,
    observacion: row.observacion,
    usuario: { id: row.usuarioId, nombre: row.usuarioNombre },
    ...(saldoCliente !== null ? { saldoCliente } : {}),
  };
}

const seleccionRecibo = {
  id: pagos.id,
  numeroRecibo: pagos.numeroRecibo,
  fecha: pagos.fecha,
  importe: pagos.importe,
  medio: pagos.medio,
  observacion: pagos.observacion,
  clienteId: clientes.id,
  clienteNombre: clientes.nombre,
  usuarioId: usuarios.id,
  usuarioNombre: usuarios.nombre,
};

function reciboQuery() {
  return db
    .select(seleccionRecibo)
    .from(pagos)
    .innerJoin(clientes, eq(pagos.clienteId, clientes.id))
    .innerJoin(usuarios, eq(pagos.usuarioId, usuarios.id));
}

/**
 * RF-C5 / reglas 4, 8 y 11: graba el pago con su recibo numerado y el crédito
 * en la cuenta corriente en UNA transacción. Un pago nunca supera la deuda.
 */
export async function registrar(
  usuario: AuthUser,
  clienteId: number,
  input: unknown,
  opciones?: { fecha?: Date },
) {
  requireAuth(usuario);
  const data = parseOrThrow(registrarPagoSchema, input);

  return db.transaction(async (tx) => {
    const [cliente] = await tx.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1);
    if (!cliente) throw err.noEncontrado("El cliente");
    if (!cliente.activo) {
      throw new ApiError(422, "VALIDACION", "El cliente está dado de baja.", [
        { campo: "clienteId", mensaje: "El cliente está dado de baja." },
      ]);
    }
    if (!cliente.cuentaCorriente) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "El cliente no tiene cuenta corriente habilitada.");
    }

    const saldo = await getSaldo(clienteId, tx);
    if (data.importe > saldo) {
      throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El importe supera la deuda del cliente.");
    }

    const secuencia = await nextSecuencia(tx, "recibo");
    const fecha = opciones?.fecha ?? new Date();
    const [pago] = await tx
      .insert(pagos)
      .values({
        numeroRecibo: secuencia.ultimo,
        fecha,
        importe: data.importe,
        medio: data.medio,
        observacion: data.observacion,
        clienteId,
        usuarioId: usuario.id,
      })
      .returning();

    await tx.insert(movimientosCuenta).values({
      clienteId,
      tipo: "credito",
      importe: data.importe,
      descripcion: `Recibo ${formatRecibo(secuencia.puntoVenta, secuencia.ultimo)}`,
      pagoId: pago.id,
      fecha: pago.fecha,
    });

    const [row] = await tx
      .select(seleccionRecibo)
      .from(pagos)
      .innerJoin(clientes, eq(pagos.clienteId, clientes.id))
      .innerJoin(usuarios, eq(pagos.usuarioId, usuarios.id))
      .where(eq(pagos.id, pago.id))
      .limit(1);

    return publico(row, await getSaldo(clienteId, tx));
  });
}

/** RF-C5: reimpresión del recibo. */
export async function obtener(usuario: AuthUser, id: number) {
  requireAuth(usuario);
  const [row] = await reciboQuery().where(eq(pagos.id, id)).limit(1);
  if (!row) throw err.noEncontrado("El recibo");
  // Regla 11 / RF-C5: el recibo reimpreso muestra el saldo de su fecha, no el actual.
  return publico(row, await getSaldoHasta(row.clienteId, row.fecha));
}
