import { createApp } from "./app";
import { runMigrations } from "./db";
import { config } from "./config";

async function main() {
  // Run database migrations on startup
  runMigrations();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`✓ StudyFlow API running on http://localhost:${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
