import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema";
import * as relations from "./relations";
import { config } from "../config";
import path from "path";

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

export async function runMigrations() {
  const migrationsFolder = path.join(__dirname, "../../drizzle/migrations");
  await migrate(db, { migrationsFolder });
  console.log("✓ Database migrations applied");
}

export { schema };
