import { ok } from "@/lib/api/response";
import { parseId } from "@/lib/api/params";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/usuarios.service";

/** POST /api/usuarios/{id}/reset-password — RF-U5 (admin). */
export const POST = withApi(async ({ user, params }) =>
  ok(await service.resetPassword(user, parseId(params.id))),
);
