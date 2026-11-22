import { ok } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/auth.service";

/** GET /api/auth/me — RF-U2. */
export const GET = withApi(async ({ user }) => ok(service.me(user)));
