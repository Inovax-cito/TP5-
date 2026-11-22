import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/clientes.service";

/** GET /api/clientes/{id} — RF-C3. */
export const GET = withApi(async ({ user, params }) =>
  ok(await service.obtener(user, parseId(params.id))),
);

/** PATCH /api/clientes/{id} — RF-C2 y RF-C7. */
export const PATCH = withApi(async ({ user, params, body }) =>
  ok(await service.actualizar(user, parseId(params.id), body)),
);
