import { ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/facturas.service";

/** GET /api/facturas/proximo-numero — RF-V1 (informativo). */
export const GET = withApi(async ({ user }) => ok(await service.proximoNumero(user)));
