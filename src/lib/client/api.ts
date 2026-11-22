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

/** Convierte losdetails de Zod o del servicio en errores por campo. */
export function mapApiErrors(error: unknown): {
  errores: Record<string, string>;
  mensaje: string | null;
} {
  if (error instanceof ApiClientError) {
    const errores: Record<string, string> = {};
    for (const detail of error.details) {
      if (detail.campo && detail.mensaje) errores[detail.campo] = detail.mensaje;
    }
    return { errores, mensaje: Object.keys(errores).length ? null : error.message };
  }
  return { errores: {}, mensaje: error instanceof Error ? error.message : "Error inesperado." };
}
