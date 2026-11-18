import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./token";

export {
  SESSION_COOKIE,
  MAX_AGE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "./token";

/** Lee el id de sesión desde la cookie httpOnly (servidor). */
export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
