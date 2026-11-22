import { z } from "zod";

/**
 * Sección 11.1: los query params también se validan. Un filtro inválido debe
 * responder 422 y no transformarse silenciosamente en un listado vacío.
 * Los valores vacíos se tratan como "no enviados" (FilterBar los omite).
 */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((valor) => (valor === "" || valor === null ? undefined : valor), schema);

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato AAAA-MM-DD.")
  .refine((valor) => new Date(`${valor}T12:00:00.000Z`).toISOString().slice(0, 10) === valor, "La fecha no existe.");

const enteroPositivo = (label: string) =>
  z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? undefined : Number(valor)),
    z.number().int(`${label} debe ser un número entero.`).positive(`${label} debe ser mayor que cero.`).optional(),
  );

export const listaQuerySchema = z
  .object({
    q: opcional(z.string().trim().max(200, "La búsqueda no puede superar 200 caracteres.").optional()),
    page: z.preprocess(
      (valor) => (valor === undefined || valor === "" ? 1 : Number(valor)),
      z.number().int("La página debe ser un número entero.").positive("La página debe ser mayor que cero.").max(100000).default(1),
    ),
    pageSize: z.preprocess(
      (valor) => (valor === undefined || valor === "" ? 20 : Number(valor)),
      z.number().int("pageSize debe ser un número entero.").positive("pageSize debe ser mayor que cero.").max(100, "pageSize no puede superar 100.").default(20),
    ),
  })
  .strict();

/** RF-V8: filtros del listado de facturas. */
export const facturasQuerySchema = listaQuerySchema
  .extend({
    desde: opcional(fecha.optional()),
    hasta: opcional(fecha.optional()),
    clienteId: enteroPositivo("El cliente"),
    vendedorId: enteroPositivo("El vendedor"),
    forma: opcional(z.enum(["contado", "tarjeta", "cuenta_corriente"]).optional()),
    estado: opcional(z.enum(["emitida", "anulada"]).optional()),
  })
  .strict();
