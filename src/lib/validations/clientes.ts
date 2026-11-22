import { z } from "zod";
import { docSchema, emailOpcional, enteroNoNegativo, texto, textoOpcional } from "./common";

/** RF-C2 / RF-V2: también lo usa el alta rápida desde Nueva venta. */
export const crearClienteSchema = z
  .object({
    tipoDoc: z.enum(["DNI", "CUIT"], { error: "Seleccioná DNI o CUIT." }),
    nroDoc: docSchema,
    nombre: texto("Nombre o razón social"),
    domicilio: textoOpcional(),
    telefono: textoOpcional(),
    email: emailOpcional(),
    cuentaCorriente: z.boolean({ error: "Debe ser verdadero o falso." }).default(false),
    limiteCredito: enteroNoNegativo("Límite de crédito").nullable().optional(),
  })
  .strict();

export const actualizarClienteSchema = crearClienteSchema
  .partial()
  .extend({
    activo: z.boolean({ error: "Activo debe ser verdadero o falso." }).optional(),
  })
  .strict();

/** RF-C5 */
export const registrarPagoSchema = z
  .object({
    importe: enteroNoNegativo("Importe").refine((v) => v > 0, "El importe debe ser mayor que cero."),
    medio: z.enum(["efectivo", "transferencia", "tarjeta_debito"], {
      error: "Seleccioná un medio de pago válido.",
    }),
    observacion: textoOpcional(),
  })
  .strict();
