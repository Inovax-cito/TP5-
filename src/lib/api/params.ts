import { err } from "@/lib/errors";

/** Parámetros de ruta: identificadores enteros positivos. */
export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw err.noEncontrado("El recurso");
  return id;
}
