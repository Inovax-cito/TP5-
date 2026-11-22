import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/productos.service";

/** GET /api/productos/{id} — RF-P1. */
export const GET = withApi(async ({ user, params }) =>
  ok(await service.obtener(user, parseId(params.id))),
);

/** PATCH /api/productos/{id} — RF-P2 y RF-P3 (admin). */
export const PATCH = withApi(async ({ user, params, body }) =>
  ok(await service.actualizar(user, parseId(params.id), body)),
);
