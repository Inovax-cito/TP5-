import { created, fromPaginated } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/productos.service";

/** GET /api/productos/{id}/movimientos — RF-P6. */
export const GET = withApi(async ({ user, params, query }) =>
  fromPaginated(await service.movimientos(user, parseId(params.id), query)),
);

/** POST /api/productos/{id}/movimientos — RF-P4 y RF-P5 (admin). */
export const POST = withApi(async ({ user, params, body }) =>
  created(await service.registrarMovimiento(user, parseId(params.id), body)),
);
