import { z } from "zod";
import { texto } from "./common";

/** RF-U1 */
export const loginSchema = z
  .object({
    email: z.email("Ingresá un email válido."),
    password: texto("Contraseña"),
  })
  .strict();

/** RF-U5 */
export const cambiarPasswordSchema = z
  .object({
    actual: texto("Contraseña actual"),
    nueva: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  })
  .strict();
