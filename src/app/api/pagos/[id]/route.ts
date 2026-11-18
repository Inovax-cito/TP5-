import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/pagos.service";

/** GET /api/pagos/{id} — RF-C5 (reimpresión del recibo). */
export const GET = withApi(async ({ user, params }) =>
  ok(await service.obtener(user, parseId(params.id))),
);
