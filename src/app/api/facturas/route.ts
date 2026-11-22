import { created, fromPaginated } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/facturas.service";

/** GET /api/facturas — RF-V8. */
export const GET = withApi(async ({ user, query }) => fromPaginated(await service.listar(user, query)));

/** POST /api/facturas — RF-V1 a RF-V6 (operación atómica). */
export const POST = withApi(async ({ user, body }) => created(await service.emitir(user, body)));
