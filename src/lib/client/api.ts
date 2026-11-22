/** Adaptador de la API para componentes cliente (no contiene reglas de negocio). */

export type ErrorDetalle = { campo?: string; mensaje?: string };
export type ApiErrorPayload = {
  error?: { code?: string; message?: string; details?: ErrorDetalle[] };
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly details: ErrorDetalle[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const texto = await response.text();
  const json: unknown = texto ? JSON.parse(texto) : null;

  if (!response.ok) {
    const error = (json ?? {}) as ApiErrorPayload;
    throw new ApiClientError(
      response.status,
      error.error?.code,
      error.error?.message ?? "No se pudo completar la operación.",
      error.error?.details ?? [],
    );
  }

  return json as T;
}

type ErroresMapeados = { errores: Record<string, string>; mensaje: string | null };

/**
 * Convierte el cuerpo de error de la sección 11.1 (de la API o de una Server Action)
 * en errores por campo; si no hay ninguno, deja el mensaje general.
 */
export function mapErrorPayload(error: { message: string; details?: ErrorDetalle[] }): ErroresMapeados {
  const errores: Record<string, string> = {};
  for (const detail of error.details ?? []) {
    if (detail.campo && detail.mensaje) errores[detail.campo] = detail.mensaje;
  }
  return { errores, mensaje: Object.keys(errores).length ? null : error.message };
}

/** Convierte los details de Zod o del servicio en errores por campo. */
export function mapApiErrors(error: unknown): ErroresMapeados {
  if (error instanceof ApiClientError) return mapErrorPayload(error);
  return { errores: {}, mensaje: error instanceof Error ? error.message : "Error inesperado." };
}
