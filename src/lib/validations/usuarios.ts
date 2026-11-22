import { z } from "zod";
import { texto } from "./common";

/** RF-U4 */
export const crearUsuarioSchema = z
  .object({
    nombre: texto("Nombre"),
    email: z.email("Ingresá un email válido."),
    rol: z.enum(["admin", "vendedor"], { error: "Seleccioná un rol válido." }),
    password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres."),
  })
  .strict();

export const actualizarUsuarioSchema = z
  .object({
    nombre: texto("Nombre").optional(),
    email: z.email("Ingresá un email válido.").optional(),
    rol: z.enum(["admin", "vendedor"], { error: "Seleccioná un rol válido." }).optional(),
    activo: z.boolean({ error: "Activo debe ser verdadero o falso." }).optional(),
  })
  .strict();
