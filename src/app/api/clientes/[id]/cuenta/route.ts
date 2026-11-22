import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/clientes.service";

/** GET /api/clientes/{id}/cuenta — RF-C4. */
export const GET = withApi(async ({ user, params, query }) =>
  ok(await service.cuenta(user, parseId(params.id), query)),
);
