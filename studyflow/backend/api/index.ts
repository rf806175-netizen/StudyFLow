import { createApp } from "../src/app";
import { runMigrations } from "../src/db";

const app = createApp();

// Run migrations on cold start so tables exist in the database
runMigrations().catch(console.error);

export default app;
