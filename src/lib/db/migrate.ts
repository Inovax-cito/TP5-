import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config();

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
  const client = createClient({ url, authToken });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  client.close();
  console.log(`Migraciones aplicadas correctamente (${url}).`);
}

main().catch((error) => {
  console.error("Error al aplicar migraciones:", error);
  process.exit(1);
});
