"use server";

import { parseId } from "@/lib/api/params";
import * as service from "@/lib/services/categorias.service";
import { withAction } from "./with-action";

// Sección 10.3: mismas funciones de servicio que POST /api/categorias y PATCH /api/categorias/{id}.
// Las acciones no validan ni verifican permisos: eso lo hace el servicio (403 al vendedor).

/** RF-P7: alta de categoría (admin). */
export async function crearCategoria(input: unknown) {
  return withAction((usuario) => service.crear(usuario, input));
}

/** RF-P7: edición de categoría (admin). */
export async function actualizarCategoria(id: unknown, input: unknown) {
  return withAction((usuario) => service.actualizar(usuario, parseId(String(id)), input));
}
