import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Un único driver para los dos entornos (sección 9):
 * - desarrollo: file:./dev.db (SQLite local)
 * - producción: libsql://... + token (Turso)
 */
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

export const client = createClient({ url, authToken });
export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
