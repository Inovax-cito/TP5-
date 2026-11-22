import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/categorias.service";

/** PATCH /api/categorias/{id} — RF-P7 (admin). */
export const PATCH = withApi(async ({ user, params, body }) =>
  ok(await service.actualizar(user, parseId(params.id), body)),
);
