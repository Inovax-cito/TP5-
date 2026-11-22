import type { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { AuthUser } from "@/lib/db/schema";
import { ApiError } from "@/lib/errors";
import { errorResponse } from "./response";

export type ApiContext = {
  req: NextRequest;
  user: AuthUser;
  params: Record<string, string>;
  body: unknown;
  query: URLSearchParams;
};

type Handler = (ctx: ApiContext) => Promise<NextResponse> | NextResponse;

/**
 * Adaptador común de las 31 rutas (sección 10.3):
 * exige sesión, lee el cuerpo, resuelve parámetros y traduce errores.
 * Las rutas solo llaman a un servicio y responden.
 */
export function withApi(handler: Handler, options?: { public?: boolean }) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    try {
      const params = await routeCtx.params;
      const user = options?.public ? null : await requireCurrentUser();

      let body: unknown;
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const raw = await req.text();
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es un JSON válido.");
          }
        }
      }

      return await handler({ req, user: user as AuthUser, params, body, query: req.nextUrl.searchParams });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
