import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/facturas.service";

/** GET /api/facturas/{id} — RF-V7 (comprobante). */
export const GET = withApi(async ({ user, params }) =>
  ok(await service.obtener(user, parseId(params.id))),
);
