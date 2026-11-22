"use server";

import { parseId } from "@/lib/api/params";
import * as service from "@/lib/services/clientes.service";
import { withAction } from "./with-action";

// Sección 10.3: mismas funciones de servicio que POST /api/clientes y PATCH /api/clientes/{id}.
// Las acciones no validan ni aplican reglas: eso lo hace el servicio.

/** RF-C2 y RF-V2: alta de cliente, también la alta rápida desde la venta. */
export async function crearCliente(input: unknown) {
  return withAction((usuario) => service.crear(usuario, input));
}

/** RF-C2: edición de los datos del cliente. */
export async function actualizarCliente(id: unknown, input: unknown) {
  return withAction((usuario) => service.actualizar(usuario, parseId(String(id)), input));
}
