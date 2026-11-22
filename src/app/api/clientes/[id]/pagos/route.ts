import { created } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/pagos.service";

/** POST /api/clientes/{id}/pagos — RF-C5. */
export const POST = withApi(async ({ user, params, body }) =>
  created(await service.registrar(user, parseId(params.id), body)),
);
