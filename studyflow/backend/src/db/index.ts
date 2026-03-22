import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import * as relations from "./relations";
import { config } from "../config";
import path from "path";

const sqlite = new Database(config.databaseUrl);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema: { ...schema, ...relations } });

export function runMigrations() {
  const migrationsFolder = path.join(__dirname, "../../drizzle/migrations");
  migrate(db, { migrationsFolder });
  console.log("✓ Database migrations applied");
}

export { schema };
