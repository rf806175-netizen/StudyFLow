"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const reports_1 = __importDefault(require("./routes/reports"));
const tutoring_1 = __importDefault(require("./routes/tutoring"));
const payments_1 = __importDefault(require("./routes/payments"));
function createApp() {
    const app = (0, express_1.default)();
    // Security headers
    app.use((0, helmet_1.default)());
    // CORS — only allow frontend origin
    app.use((0, cors_1.default)({
        origin: config_1.config.frontendUrl,
        credentials: true,
    }));
    // Stripe webhooks need raw body for signature verification
    app.use("/api/webhooks/stripe", express_1.default.raw({ type: "application/json" }));
    // JSON body parser for all other routes
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    // Health check
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // API routes
    app.use("/api/auth", auth_1.default);
    app.use("/api/subjects", subjects_1.default);
    app.use("/api/sessions", sessions_1.default);
    app.use("/api/schedule", schedule_1.default);
    app.use("/api/reports", reports_1.default);
    app.use("/api/tutoring", tutoring_1.default);
    app.use("/api/payments", payments_1.default);
    // Global error handler
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });
    return app;
}
//# sourceMappingURL=app.js.map