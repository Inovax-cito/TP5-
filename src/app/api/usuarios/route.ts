import { created, fromPaginated, ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/usuarios.service";

/** GET /api/usuarios — RF-U4 (admin). */
export const GET = withApi(async ({ user, query }) => fromPaginated(await service.listar(user, query)));

/** POST /api/usuarios — RF-U4 (admin). */
export const POST = withApi(async ({ user, body }) => created(await service.crear(user, body)));
