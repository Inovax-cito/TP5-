import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { usuarios, type AuthUser } from "@/lib/db/schema";
import { ApiError } from "@/lib/errors";
import { cambiarPasswordSchema, loginSchema } from "@/lib/validations/auth";
import { parseOrThrow } from "@/lib/validations/parse";

function publico(row: {
  id: number;
  nombre: string;
  email: string;
  rol: AuthUser["rol"];
  activo: boolean;
}): AuthUser {
  return { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol, activo: row.activo };
}

/** RF-U1: login con email y contraseña. El mismo error para los 3 casos de fallo. */
export async function login(input: unknown): Promise<AuthUser> {
  const data = parseOrThrow(loginSchema, input);
  const email = data.email.toLowerCase().trim();

  const [row] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  const mensaje = "Email o contraseña incorrectos.";
  if (!row || !row.activo || !(await verifyPassword(data.password, row.passwordHash))) {
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", mensaje);
  }

  return publico(row);
}

/** RF-U2: datos del usuario conectado. */
export function me(usuario: AuthUser): AuthUser {
  return publico(requireAuth(usuario));
}

/** RF-U5: cada usuario cambia su propia contraseña. */
export async function cambiarPassword(usuario: AuthUser, input: unknown): Promise<void> {
  const user = requireAuth(usuario);
  const data = parseOrThrow(cambiarPasswordSchema, input);

  const [row] = await db.select().from(usuarios).where(eq(usuarios.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(data.actual, row.passwordHash))) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.");
  }

  await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(data.nueva) })
    .where(eq(usuarios.id, user.id));
}
