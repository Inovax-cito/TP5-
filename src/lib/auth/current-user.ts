import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, type AuthUser } from "@/lib/db/schema";
import { getSessionUserId } from "./session";

/**
 * RF-U2 / sección 10.5: el usuario se resuelve contra la BD en CADA pedido.
 * Un usuario desactivado o con otro rol pierde el acceso aunque conserve la cookie.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;

  const [row] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(eq(usuarios.id, id))
    .limit(1);

  if (!row || !row.activo) return null;
  return row;
}

/** Para páginas y Server Actions: lanza 401 si no hay sesión válida. */
export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { err } = await import("@/lib/errors");
    throw err.noAutenticado();
  }
  return user;
}
