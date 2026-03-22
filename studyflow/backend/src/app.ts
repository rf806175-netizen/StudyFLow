import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";

// Routes
import authRoutes from "./routes/auth";
import subjectsRoutes from "./routes/subjects";
import sessionsRoutes from "./routes/sessions";
import scheduleRoutes from "./routes/schedule";
import reportsRoutes from "./routes/reports";
import tutoringRoutes from "./routes/tutoring";
import paymentsRoutes from "./routes/payments";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — only allow frontend origin
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );

  // Stripe webhooks need raw body for signature verification
  app.use(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" })
  );

  // JSON body parser for all other routes
  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/subjects", subjectsRoutes);
  app.use("/api/sessions", sessionsRoutes);
  app.use("/api/schedule", scheduleRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/tutoring", tutoringRoutes);
  app.use("/api/payments", paymentsRoutes);

  // Global error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}
