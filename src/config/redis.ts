import { createClient, RedisClientType } from 'redis';
import logger from '@utils/logger';

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'; // Enabled by default

let redisClient: RedisClientType | null = null;
let isConnected = false;

/**
 * Initialize Redis connection
 * Returns null if Redis is disabled or connection fails
 */
export const initializeRedis = async (): Promise<void> => {
  if (!REDIS_ENABLED) {
    logger.info('ℹ️  Redis disabled (set REDIS_ENABLED=true to enable)');
    return;
  }

  try {
    const url = `redis://${REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : ''}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;
    
    redisClient = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('❌ Redis max retries exceeded');
            return new Error('Max retries');
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    // Handle connection errors without crashing
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✓ Redis connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      logger.warn('⚠️  Redis disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    isConnected = true;
    logger.info(`✓ Redis initialized at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    redisClient = null;
    isConnected = false;
    logger.warn('⚠️  Falling back to in-memory caching only');
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Check if Redis is connected and ready
 */
export const isRedisConnected = (): boolean => {
  return isConnected && redisClient !== null;
};

/**
 * Close Redis connection (call on server shutdown)
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('✓ Redis connection closed');
  }
};

export default {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
};
