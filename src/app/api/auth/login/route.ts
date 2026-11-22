import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/auth.service";

/** POST /api/auth/login — RF-U1 (público). */
export const POST = withApi(
  async ({ body }) => {
    const usuario = await service.login(body);
    const token = await createSessionToken(usuario.id);
    const response = ok(usuario);
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  },
  { public: true },
);
