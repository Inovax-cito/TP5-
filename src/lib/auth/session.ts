import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "gc_sesion";
const MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  const value =
    process.env.SESSION_SECRET ??
    "secreto-de-desarrollo-cambiame-por-un-valor-largo-y-aleatorio";
  return new TextEncoder().encode(value);
}

/** RF-U1: token firmado HS256. La cookie la escribe el adaptador. */
export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

/** RF-U2: verifica la firma y el vencimiento. Devuelve el id de usuario. */
export async function verifySessionToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = Number(payload.sub);
    return Number.isInteger(sub) && sub > 0 ? sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

/** Lee el id de sesión desde la cookie httpOnly (servidor). */
export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
