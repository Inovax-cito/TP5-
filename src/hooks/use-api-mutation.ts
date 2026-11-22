"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import type { ActionResult } from "@/lib/actions/result";
import { apiFetch, mapApiErrors, mapErrorPayload } from "@/lib/client/api";

type Opciones<T> = {
  mensaje?: string;
  alTerminar?: (data: T) => void;
};

/**
 * Un hook para todos los formularios: valida con el esquema compartido, envía la
 * mutación, muestra el aviso y deja los errores junto al campo (sección 10.6).
 * Dos formas de enviar, con el mismo manejo de errores:
 * - `ejecutarAccion`: Server Action (sección 10.3, la vía para las mutaciones).
 * - `ejecutar`: API REST (búsqueda en vivo y confirmación de la venta).
 */
export function useApiMutation<S extends z.ZodType>(schema: S, mensajePorDefecto?: string) {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  /** Primero los errores de Zod en el cliente; si hay, no se envía nada. */
  function validar(valores: unknown): z.infer<S> | null {
    const validacion = schema.safeParse(valores);
    if (validacion.success) return validacion.data;
    const porCampo: Record<string, string> = {};
    for (const issue of validacion.error.issues) {
      const campo = issue.path.join(".") || "general";
      if (!porCampo[campo]) porCampo[campo] = issue.message;
    }
    setErrores(porCampo);
    return null;
  }

  function exito<T>(data: T, opciones?: Opciones<T>) {
    toast.success(opciones?.mensaje ?? mensajePorDefecto ?? "Operación realizada correctamente.");
    opciones?.alTerminar?.(data);
  }

  /** Después, los errores del servidor: por campo si vienen con detalle, si no el mensaje general. */
  function fallo(mapeado: { errores: Record<string, string>; mensaje: string | null }) {
    setErrores(mapeado.errores);
    setErrorGeneral(mapeado.mensaje);
    if (mapeado.mensaje) toast.error(mapeado.mensaje);
  }

  async function correr<T>(valores: unknown, enviar: (datos: z.infer<S>) => Promise<T | null>) {
    setCargando(true);
    setErrores({});
    setErrorGeneral(null);
    try {
      const datos = validar(valores);
      return datos === null ? null : await enviar(datos);
    } finally {
      setCargando(false);
    }
  }

  /** Envía a la API REST. */
  async function ejecutar<T>(
    valores: unknown,
    url: string,
    method: "POST" | "PATCH" | "PUT" = "POST",
    opciones?: Opciones<T>,
  ): Promise<T | null> {
    return correr(valores, async (datos) => {
      try {
        const data = await apiFetch<T>(url, { method, body: JSON.stringify(datos) });
        exito(data, opciones);
        return data;
      } catch (error) {
        fallo(mapApiErrors(error));
        return null;
      }
    });
  }

  /** Envía a una Server Action, que devuelve `{ ok, data }` o `{ ok: false, error }`. */
  async function ejecutarAccion<T>(
    valores: unknown,
    accion: (datos: z.infer<S>) => Promise<ActionResult<T>>,
    opciones?: Opciones<T>,
  ): Promise<T | null> {
    return correr(valores, async (datos) => {
      try {
        const resultado = await accion(datos);
        if (resultado.ok) {
          exito(resultado.data, opciones);
          return resultado.data;
        }
        fallo(mapErrorPayload(resultado.error));
        return null;
      } catch {
        // Solo llega acá si falló la red: los errores del servidor vienen en el resultado.
        fallo({ errores: {}, mensaje: "No se pudo conectar con el servidor." });
        return null;
      }
    });
  }

  function limpiar() {
    setErrores({});
    setErrorGeneral(null);
  }

  /** Errores de validación local, para pintarlos junto al campo (sección 8). */
  function marcarErrores(nuevos: Record<string, string>, mensaje: string | null = null) {
    setErrores(nuevos);
    setErrorGeneral(mensaje);
  }

  return { ejecutar, ejecutarAccion, errores, errorGeneral, cargando, limpiar, marcarErrores };
}
