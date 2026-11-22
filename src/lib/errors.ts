/**
 * Única clase de error del dominio (sección 10.4).
 * Los adaptadores la traducen al formato estándar de la API (sección 11.1).
 */
export type ApiErrorCode =
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "CREDENCIALES_INVALIDAS"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "CODIGO_DUPLICADO"
  | "DOCUMENTO_DUPLICADO"
  | "EMAIL_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CATEGORIA_EN_USO"
  | "STOCK_INSUFICIENTE"
  | "FACTURA_ANULADA"
  | "VALIDACION"
  | "PRODUCTO_INACTIVO"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "LIMITE_CREDITO_EXCEDIDO"
  | "MONTO_INSUFICIENTE"
  | "PAGO_SUPERA_DEUDA"
  | "SALDO_PENDIENTE"
  | "CONTRASENA_ACTUAL_INCORRECTA"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ERROR_INTERNO";

export type ErrorDetail = Record<string, unknown> & {
  campo?: string;
  mensaje?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Cuerpo público de un error (sección 11.1), igual para rutas y Server Actions. */
export type ErrorPublico = {
  code: ApiErrorCode;
  message: string;
  details?: ErrorDetail[];
};

/**
 * Sección 10.3 y 11.1: traduce cualquier error al formato público. Lo usan los dos
 * adaptadores (Route Handlers y Server Actions) para no repetir la conversión.
 * Un error inesperado se loguea en el servidor y sale como 500 ERROR_INTERNO sin detalle.
 */
export function aErrorPublico(error: unknown): { status: number; error: ErrorPublico } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details?.length ? { details: error.details } : {}),
      },
    };
  }

  console.error("[ERROR_INTERNO]", error);
  return { status: 500, error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado." } };
}

/** Fábricas de errores para no repetir códigos ni mensajes en los servicios. */
export const err = {
  noAutenticado: () => new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar."),
  sinPermiso: () => new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta operación."),
  noEncontrado: (recurso = "El recurso") =>
    new ApiError(404, "NO_ENCONTRADO", `${recurso} no fue encontrado.`),
  validacion: (message = "Hay campos con errores.", details?: ErrorDetail[]) =>
    new ApiError(422, "VALIDACION", message, details),
  duplicado: (code: ApiErrorCode, message: string) => new ApiError(409, code, message),
  stockInsuficiente: (details?: ErrorDetail[]) =>
    new ApiError(409, "STOCK_INSUFICIENTE", "No hay existencia suficiente.", details),
};
