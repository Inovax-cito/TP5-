import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Conexión única a la base (capa de acceso a datos, sección 10.1).
// - Desarrollo: SQLite local, DATABASE_URL=file:local.db, sin token.
// - Producción: Turso, DATABASE_URL=libsql://<base>.turso.io + DATABASE_AUTH_TOKEN.
// libSQL activa las claves foráneas por defecto (PRAGMA foreign_keys = 1).
function crearCliente(): Client {
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV === "production") {
    throw new Error("Falta la variable de entorno DATABASE_URL.");
  }
  return createClient({
    url: url ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
}

// En desarrollo, Next recarga módulos en caliente: reusamos el cliente para no
// abrir una conexión nueva en cada recarga.
const globalParaDb = globalThis as unknown as { clienteDb?: Client };
const cliente = globalParaDb.clienteDb ?? crearCliente();
if (process.env.NODE_ENV !== "production") globalParaDb.clienteDb = cliente;

export const db = drizzle(cliente, { schema });
export type Db = typeof db;
/** Tipo de la transacción de Drizzle, para pasarla a funciones como moverStock(). */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
