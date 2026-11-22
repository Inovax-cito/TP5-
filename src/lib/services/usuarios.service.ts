import { and, eq, like, ne, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/permissions";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { usuarios, type AuthUser } from "@/lib/db/schema";
import { ApiError, err } from "@/lib/errors";
import { boolParam, getPagination } from "@/lib/api/pagination";
import { parseOrThrow } from "@/lib/validations/parse";
import { actualizarUsuarioSchema, crearUsuarioSchema } from "@/lib/validations/usuarios";

function publico(row: typeof usuarios.$inferSelect): AuthUser {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    activo: row.activo,
  };
}

/** RF-U4: listado paginado, sin el hash de contraseña. */
export async function listar(usuario: AuthUser, query: URLSearchParams) {
  requireAdmin(usuario);
  const { page, pageSize, offset, limit } = getPagination(query);
  const q = query.get("q")?.trim();
  const activo = boolParam(query.get("activo"));

  const conditions = [];
  if (q) conditions.push(or(like(usuarios.nombre, `%${q}%`), like(usuarios.email, `%${q}%`))!);
  if (activo !== undefined) conditions.push(eq(usuarios.activo, activo));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(usuarios)
    .where(where)
    .orderBy(usuarios.nombre)
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: db.$count(usuarios, where) })
    .from(usuarios);

  return { data: rows.map(publico), page, pageSize, total: Number(count) };
}

/** RF-U4: alta de usuario con contraseña temporal. */
export async function crear(usuario: AuthUser, input: unknown): Promise<AuthUser> {
  requireAdmin(usuario);
  const data = parseOrThrow(crearUsuarioSchema, input);
  const email = data.email.toLowerCase().trim();

  const existe = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (existe.length) throw err.duplicado("EMAIL_DUPLICADO", "Ya existe un usuario con ese email.");

  const [row] = await db
    .insert(usuarios)
    .values({
      nombre: data.nombre,
      email,
      rol: data.rol,
      passwordHash: await hashPassword(data.password),
      activo: true,
    })
    .returning();

  return publico(row);
}

/** RF-U4: edición. Regla 11.3: un admin no puede desactivarse ni quitarse el rol. */
export async function actualizar(usuario: AuthUser, id: number, input: unknown): Promise<AuthUser> {
  requireAdmin(usuario);
  const data = parseOrThrow(actualizarUsuarioSchema, input);

  if (id === usuario.id && (data.activo === false || (data.rol && data.rol !== "admin"))) {
    throw new ApiError(
      422,
      "OPERACION_SOBRE_SI_MISMO",
      "No podés desactivarte ni quitarte el rol de administrador.",
    );
  }

  if (data.email) {
    const email = data.email.toLowerCase().trim();
    const existe = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.email, email), ne(usuarios.id, id)))
      .limit(1);
    if (existe.length) throw err.duplicado("EMAIL_DUPLICADO", "Ya existe un usuario con ese email.");
  }

  const [row] = await db
    .update(usuarios)
    .set({
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.email !== undefined ? { email: data.email.toLowerCase().trim() } : {}),
      ...(data.rol !== undefined ? { rol: data.rol } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    })
    .where(eq(usuarios.id, id))
    .returning();

  if (!row) throw err.noEncontrado("El usuario");
  return publico(row);
}

/** RF-U5: restablece la contraseña; se muestra una sola vez. */
export async function resetPassword(usuario: AuthUser, id: number) {
  requireAdmin(usuario);
  const passwordTemporal = generateTemporaryPassword();
  const [row] = await db
    .update(usuarios)
    .set({ passwordHash: await hashPassword(passwordTemporal) })
    .where(eq(usuarios.id, id))
    .returning({ id: usuarios.id });

  if (!row) throw err.noEncontrado("El usuario");
  return { passwordTemporal };
}
