import { z } from "zod";
import { enteroNoNegativo, enteroPositivo, texto } from "./common";

/** RF-V3: el cliente envía producto y cantidad; el servidor fija el precio (11.1). */
const itemSchema = z
  .object({
    productoId: enteroPositivo("Producto"),
    cantidad: enteroPositivo("Cantidad"),
  })
  .strict();

/** RF-V5: una forma de pago por factura. */
const pagoContadoSchema = z
  .object({
    forma: z.literal("contado"),
    montoRecibido: enteroNoNegativo("Monto recibido").optional(),
  })
  .strict();

const pagoTarjetaSchema = z
  .object({
    forma: z.literal("tarjeta"),
    tarjeta: z
      .object({
        tipo: z.enum(["debito", "credito"], { error: "Seleccioná débito o crédito." }),
        marca: texto("Marca"),
        ultimos4: z
          .string()
          .regex(/^\d{4}$/, "Ingresá exactamente los últimos 4 dígitos."),
      })
      .strict(),
  })
  .strict();

const pagoCuentaSchema = z.object({ forma: z.literal("cuenta_corriente") }).strict();

/** RF-V1 a RF-V6 */
export const emitirFacturaSchema = z
  .object({
    clienteId: z.number().int().positive().nullable().optional(),
    items: z
      .array(itemSchema)
      .min(1, "Agregá al menos un producto.")
      .superRefine((items, ctx) => {
        const vistos = new Set<number>();
        items.forEach((item, index) => {
          if (vistos.has(item.productoId)) {
            ctx.addIssue({
              code: "custom",
              path: [index, "productoId"],
              message: "El producto ya está en la lista; sumá la cantidad en ese renglón.",
            });
          }
          vistos.add(item.productoId);
        });
      }),
    pago: z.discriminatedUnion("forma", [
      pagoContadoSchema,
      pagoTarjetaSchema,
      pagoCuentaSchema,
    ]),
  })
  .strict();

/** RF-V9 */
export const anularFacturaSchema = z
  .object({ motivo: texto("Motivo") })
  .strict();
