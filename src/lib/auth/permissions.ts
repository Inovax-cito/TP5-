import { err } from "@/lib/errors";
import type { AuthUser } from "@/lib/db/schema";

/**
 * RF-U2 / sección 10.5: los servicios verifican el rol, aunque la UI oculte botones.
 * El usuario ya fue resuelto contra la base de datos en cada pedido.
 */
export function requireAuth(usuario: AuthUser | null | undefined): AuthUser {
  if (!usuario) throw err.noAutenticado();
  return usuario;
}

export function requireAdmin(usuario: AuthUser | null | undefined): AuthUser {
  const user = requireAuth(usuario);
  if (user.rol !== "admin") throw err.sinPermiso();
  return user;
}
