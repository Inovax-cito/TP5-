import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "gc_sesion";
export const MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  const value =
    process.env.SESSION_SECRET ??
    "secreto-de-desarrollo-cambiame-por-un-valor-largo-y-aleatorio";
  return new TextEncoder().encode(value);
}

/** RF-U1: token firmado HS256 (sin dependencias de next/headers: funciona en Edge). */
export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

/** RF-U2: verifica firma y vencimiento; devuelve el id de usuario. */
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
