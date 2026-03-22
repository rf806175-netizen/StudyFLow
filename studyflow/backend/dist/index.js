"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./db");
const config_1 = require("./config");
async function main() {
    // Run database migrations on startup
    (0, db_1.runMigrations)();
    const app = (0, app_1.createApp)();
    app.listen(config_1.config.port, () => {
        console.log(`✓ StudyFlow API running on http://localhost:${config_1.config.port}`);
        console.log(`  Environment: ${config_1.config.nodeEnv}`);
    });
}
main().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map