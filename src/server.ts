import 'module-alias/register';
import config from './config';
import app from './app';
import logger from './utils/logger';
import { initializeRedis, closeRedis } from '@config/redis';

const PORT = config.port;
const SERVER_START_TIME = Date.now();

// Initialize Redis on startup
(async () => {
  await initializeRedis();
})().catch(err => {
  logger.error('Failed to initialize Redis:', err);
});

const server = app.listen(PORT, () => {
  const startupTime = Date.now() - SERVER_START_TIME;
  const totalTime = process.uptime() * 1000; // Convert to ms
  
  logger.info(`🚀 Server is running on port ${PORT} in ${config.env} mode`);
  logger.info(`⏱️  Startup time: ${startupTime}ms`);
  logger.info(`⏱️  Total initialization time: ${totalTime.toFixed(2)}ms`);
  logger.info(`📊 Process uptime: ${process.uptime().toFixed(2)}s`);
  // logger.info(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  
  // Export metrics for monitoring
  global.SERVER_STARTUP_METRICS = {
    startupTime,
    totalInitializationTime: totalTime,
    processUptime: process.uptime(),
    // memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    readyTime: new Date().toISOString()
  };
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  const uptime = process.uptime();
  logger.info(`📊 Server was running for ${uptime.toFixed(2)}s`);
  logger.info('SIGINT signal received: closing HTTP server');
  await closeRedis();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
