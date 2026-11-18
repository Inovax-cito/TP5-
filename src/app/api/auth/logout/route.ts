import { noContent } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

/** POST /api/auth/logout — RF-U1. */
export const POST = withApi(async () => {
  const response = noContent();
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
});
