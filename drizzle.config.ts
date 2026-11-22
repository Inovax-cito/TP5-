import { defineConfig } from "drizzle-kit";

// drizzle-kit no lee .env solo: lo cargamos si existe (Node >= 20.12).
try {
  process.loadEnvFile(".env");
} catch {
  // Sin .env: se usan las variables del entorno (por ejemplo, en Vercel).
}

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
