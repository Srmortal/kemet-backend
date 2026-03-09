import path from "node:path";
import { scopePerRequest } from "awilix-express";
import express, { type Application, json, urlencoded } from "express";
import morgan from "morgan";
import container, { resolveControllerByFeature } from "#app/di.js";
import { config } from "#app/infrastructure/config/index.js";
import { errorHandler } from "#app/shared/middleware/errorHandler.js";
import { createOpenApiRouter } from "#app/shared/routes/openapi-router.js";
import logger from "#app/shared/utils/metrics/logger.js";

const app: Application = express();
const APP_INIT_START = Date.now();
const CONTRACTS_ROOT = path.resolve(process.cwd(), "contracts");

// Body parsing middleware
app.use(json({ limit: "1mb" }));
app.use(urlencoded({ extended: true, limit: "1mb" }));

// Awilix DI container - attach container to each request
app.use(scopePerRequest(container));

// Expose cradle for easier access
app.use((req, _res, next) => {
  if (req.container) {
    req.cradle = req.container.cradle as typeof req.cradle;
  }
  next();
});

// Logging middleware
if (config.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (_req, res) => {
  const metrics = globalThis.SERVER_STARTUP_METRICS || {};
  const memUsage = process.memoryUsage();
  const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2),
    startup: {
      startupTimeMs: metrics.startupTime || null,
      totalInitializationMs: metrics.totalInitializationTime || null,
      readyAt: metrics.readyTime || null,
    },
    memory: {
      heapUsedMB: heapUsed,
      heapTotalMB: heapTotal,
      heapUsagePercent: ((heapUsed / heapTotal) * 100).toFixed(1),
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

// Runtime OpenAPI router (single source of truth for paths)
const openApiRouter = await createOpenApiRouter(
  CONTRACTS_ROOT,
  resolveControllerByFeature
);

app.use(openApiRouter);

// Error handler for non-OpenAPI errors (last)
app.use(errorHandler);

const appInitTime = Date.now() - APP_INIT_START;
if (appInitTime > 100) {
  logger.warn(`⚠️  App initialization took ${appInitTime}ms (expected <100ms)`);
}

export default app;
