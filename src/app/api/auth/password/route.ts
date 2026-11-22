import { noContent } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/auth.service";

/** PUT /api/auth/password — RF-U5. */
export const PUT = withApi(async ({ user, body }) => {
  await service.cambiarPassword(user, body);
  return noContent();
});
