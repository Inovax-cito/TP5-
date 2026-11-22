import { created, fromPaginated } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/productos.service";

/** GET /api/productos — RF-P1. */
export const GET = withApi(async ({ user, query }) => fromPaginated(await service.listar(user, query)));

/** POST /api/productos — RF-P2 (admin). */
export const POST = withApi(async ({ user, body }) => created(await service.crear(user, body)));
