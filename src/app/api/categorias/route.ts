import { created, ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/categorias.service";

/** GET /api/categorias — RF-P7. */
export const GET = withApi(async ({ user }) => ok(await service.listar(user)));

/** POST /api/categorias — RF-P7 (admin). */
export const POST = withApi(async ({ user, body }) => created(await service.crear(user, body)));
