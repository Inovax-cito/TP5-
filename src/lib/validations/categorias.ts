import { z } from "zod";
import { texto } from "./common";

/** RF-P7 */
export const crearCategoriaSchema = z.object({ nombre: texto("Nombre") }).strict();

export const actualizarCategoriaSchema = z
  .object({
    nombre: texto("Nombre").optional(),
    activa: z.boolean({ error: "Activa debe ser verdadero o falso." }).optional(),
  })
  .strict();
