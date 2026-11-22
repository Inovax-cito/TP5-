"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { apiFetch, mapApiErrors } from "@/lib/client/api";

type Opciones<T> = {
  mensaje?: string;
  alTerminar?: (data: T) => void;
};

/**
 * Un hook para todos los formularios: valida con el esquema compartido, envía a
 * la API, muestra el aviso y deja los errores junto al campo (sección 10.6).
 */
export function useApiMutation<S extends z.ZodType>(schema: S, mensajePorDefecto?: string) {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ejecutar<T>(
    valores: unknown,
    url: string,
    method: "POST" | "PATCH" | "PUT" = "POST",
    opciones?: Opciones<T>,
  ): Promise<T | null> {
    setCargando(true);
    setErrores({});
    setErrorGeneral(null);

    const validacion = schema.safeParse(valores);
    if (!validacion.success) {
      const porCampo: Record<string, string> = {};
      for (const issue of validacion.error.issues) {
        const campo = issue.path.join(".") || "general";
        if (!porCampo[campo]) porCampo[campo] = issue.message;
      }
      setErrores(porCampo);
      setCargando(false);
      return null;
    }

    try {
      const data = await apiFetch<T>(url, {
        method,
        body: JSON.stringify(validacion.data),
      });
      toast.success(opciones?.mensaje ?? mensajePorDefecto ?? "Operación realizada correctamente.");
      opciones?.alTerminar?.(data);
      return data;
    } catch (error) {
      const mapeado = mapApiErrors(error);
      setErrores(mapeado.errores);
      setErrorGeneral(mapeado.mensaje);
      if (mapeado.mensaje) toast.error(mapeado.mensaje);
      return null;
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setErrores({});
    setErrorGeneral(null);
  }

  return { ejecutar, errores, errorGeneral, cargando, limpiar };
}
