import { ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/tablero.service";

/** GET /api/tablero — RF-T1 a RF-T3. */
export const GET = withApi(async ({ user }) => ok(await service.obtener(user)));
