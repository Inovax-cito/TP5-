import { refresh } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { AuthUser } from "@/lib/db/schema";
import { aErrorPublico } from "@/lib/errors";
import type { ActionResult } from "./result";

/**
 * Sección 10.3: envoltorio común de las Server Actions, equivalente a `withApi`.
 * - Exige la sesión y resuelve el usuario contra la base en cada llamada (sección 10.5):
 *   una Server Action se puede invocar con un POST directo, igual que una ruta.
 * - Llama a UN servicio, que valida, verifica el permiso y aplica las reglas.
 * - Devuelve `{ ok: true, data }` o `{ ok: false, error }` en lugar de lanzar.
 * - Si la mutación salió bien, refresca la página actual en la misma respuesta.
 */
export async function withAction<T>(servicio: (usuario: AuthUser) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const usuario = await requireCurrentUser();
    const data = await servicio(usuario);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: aErrorPublico(error).error };
  }
}
