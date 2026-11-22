import type { z } from "zod";
import { ApiError, type ErrorDetail } from "@/lib/errors";

/**
 * RF - validación compartida (sección 10.4): el mismo esquemas valida en el
 * formulario y en el servidor. Los esquemas son .strict(): los campos no
 * previstos (por ejemplo `existencia` o el número completo de tarjeta) se rechazan.
 */
export function parseOrThrow<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const details: ErrorDetail[] = result.error.issues.map((issue) => {
    let mensaje = issue.message;
    if (issue.code === "unrecognized_keys") {
      const keys = (issue as unknown as { keys?: string[] }).keys ?? [];
      mensaje = `No se permite el campo "${keys.join('", "')}".`;
    }
    return { campo: issue.path.join(".") || "general", mensaje };
  });

  throw new ApiError(422, "VALIDACION", "Hay campos con errores.", details);
}
