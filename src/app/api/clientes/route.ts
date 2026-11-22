import { created, fromPaginated } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/clientes.service";

/** GET /api/clientes — RF-C1 y RF-C6. */
export const GET = withApi(async ({ user, query }) => fromPaginated(await service.listar(user, query)));

/** POST /api/clientes — RF-C2 y RF-V2 (alta rápida). */
export const POST = withApi(async ({ user, body }) => created(await service.crear(user, body)));
