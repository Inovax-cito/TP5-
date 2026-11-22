import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/facturas.service";

/** POST /api/facturas/{id}/anulacion — RF-V9 (admin). */
export const POST = withApi(async ({ user, params, body }) =>
  ok(await service.anular(user, parseId(params.id), body)),
);
