import { and, eq, ne } from "drizzle-orm";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { categorias, productos } from "@/lib/db/schema";
import { err } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validations/parse";
import { actualizarCategoriaSchema, crearCategoriaSchema } from "@/lib/validations/categorias";

/** RF-P7: categorías activas, sin paginar. */
export async function listar(usuario: Parameters<typeof requireAuth>[0]) {
  requireAuth(usuario);
  return db.select().from(categorias).where(eq(categorias.activa, true)).orderBy(categorias.nombre);
}

/** Categorías con una vista previa de sus productos para el tablero de imágenes. */
export async function listarConProductos(usuario: Parameters<typeof requireAuth>[0]) {
  const cats = await listar(usuario);
  const productosActivos = await db
    .select({
      id: productos.id,
      categoriaId: productos.categoriaId,
      descripcion: productos.descripcion,
      imagen: productos.imagen,
    })
    .from(productos)
    .where(eq(productos.activo, true))
    .orderBy(productos.descripcion);

  const vistas = new Map<number, Array<{ id: number; descripcion: string; imagen: string | null }>>();
  const totales = new Map<number, number>();
  for (const producto of productosActivos) {
    totales.set(producto.categoriaId, (totales.get(producto.categoriaId) ?? 0) + 1);
    const actuales = vistas.get(producto.categoriaId) ?? [];
    if (actuales.length < 4) {
      actuales.push({ id: producto.id, descripcion: producto.descripcion, imagen: producto.imagen });
      vistas.set(producto.categoriaId, actuales);
    }
  }

  return cats.map((categoria) => ({
    ...categoria,
    productos: vistas.get(categoria.id) ?? [],
    total: totales.get(categoria.id) ?? 0,
  }));
}

/** RF-P7 */
export async function crear(usuario: Parameters<typeof requireAdmin>[0], input: unknown) {
  requireAdmin(usuario);
  const data = parseOrThrow(crearCategoriaSchema, input);

  const existe = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(eq(categorias.nombre, data.nombre))
    .limit(1);
  if (existe.length) throw err.duplicado("NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.");

  const [row] = await db.insert(categorias).values({ nombre: data.nombre, activa: true }).returning();
  return row;
}

/** RF-P7: no se puede desactivar una categoría con productos activos. */
export async function actualizar(
  usuario: Parameters<typeof requireAdmin>[0],
  id: number,
  input: unknown,
) {
  requireAdmin(usuario);
  const data = parseOrThrow(actualizarCategoriaSchema, input);

  if (data.activa === false) {
    const enUso = await db
      .select({ id: productos.id })
      .from(productos)
      .where(and(eq(productos.categoriaId, id), eq(productos.activo, true)))
      .limit(1);
    if (enUso.length) {
      throw err.duplicado("CATEGORIA_EN_USO", "La categoría tiene productos activos.");
    }
  }

  if (data.nombre !== undefined) {
    const existe = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(and(eq(categorias.nombre, data.nombre), ne(categorias.id, id)))
      .limit(1);
    if (existe.length) throw err.duplicado("NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.");
  }

  const [row] = await db
    .update(categorias)
    .set({
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.activa !== undefined ? { activa: data.activa } : {}),
    })
    .where(eq(categorias.id, id))
    .returning();

  if (!row) throw err.noEncontrado("La categoría");
  return row;
}
