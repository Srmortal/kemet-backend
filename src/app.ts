import express, { Application } from 'express';
import { middleware as openApiMiddleware } from 'express-openapi-validator';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression, { filter as compressionFilter } from 'compression';
import config from './config';
import path from 'path';
// Initialize Firebase Admin SDK (reads env or service account)
import './config/firebase';
import routes from './routes';
import { errorHandler } from '@middleware/errorHandler';
import logger from '@utils/logger';
import { limiter } from '@middleware/rateLimiter';

const app: Application = express();
const APP_INIT_START = Date.now();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Reduced from 10mb

// OpenAPI validator middleware (must be before routes)
app.use(
  openApiMiddleware({
    apiSpec: path.resolve(process.cwd(), 'contracts/openapi.yaml'),
    validateRequests: true,
    validateResponses: false,
  })
);

// Compression middleware - optimize compression settings
app.use(compression({
  level: 6, // balance between compression ratio and speed
  threshold: 1024, // only compress responses larger than 1KB
  filter: (req, res) => {
    // skip compression for certain mime types
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compressionFilter(req, res);
  }
}));

// Memory cleanup per request - clear caches if memory pressure high
app.use((_req, res, next) => {
  // Hook into response finish to cleanup
  res.on('finish', () => {
    const mem = process.memoryUsage();
    const heapPercent = (mem.heapUsed / mem.heapTotal) * 100;
    
    // If memory is critically high, hint for immediate GC
    if (heapPercent > 90 && global.gc) {
      global.gc(false);
    }
  });
  
  next();
});

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint with startup metrics
app.get('/health', (_req, res) => {
  const metrics = globalThis.SERVER_STARTUP_METRICS || {};
  const memUsage = process.memoryUsage();
  const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
  const external = Math.round(memUsage.external / 1024 / 1024);
  const rss = Math.round(memUsage.rss / 1024 / 1024);
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2),
    uptimeMs: (process.uptime() * 1000).toFixed(0),
    startup: {
      startupTimeMs: metrics.startupTime || null,
      totalInitializationMs: metrics.totalInitializationTime || null,
      readyAt: metrics.readyTime || null,
    },
    memory: {
      heapUsedMB: heapUsed,
      heapTotalMB: heapTotal,
      heapUsagePercent: ((heapUsed / heapTotal) * 100).toFixed(1),
      externalMB: external,
      rssMB: rss,
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api', routes);

// Error handler for non-OpenAPI errors (should be last)
app.use(errorHandler);

// Log app initialization time
const appInitTime = Date.now() - APP_INIT_START;
if (appInitTime > 100) {
  logger.warn(`⚠️  App initialization took ${appInitTime}ms (expected <100ms)`);
}

export default app;
