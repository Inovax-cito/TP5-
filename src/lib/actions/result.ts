import type { ErrorPublico } from "@/lib/errors";

/**
 * Sección 10.3: una Server Action no lanza; devuelve el resultado o el error con el
 * mismo cuerpo que la API (sección 11.1), para mostrarlo junto al campo.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ErrorPublico };
