import './env';
import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import logger from '@utils/logger';


interface Config {
  env: string;
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  },
  rateLimit: {
    windowMs: process.env.NODE_ENV === 'test' ? 10000 : 15 * 60 * 1000, // 10 seconds for tests, 15 minutes for production
    max: process.env.NODE_ENV === 'test' ? 200 : 100, // 200 requests per 10s for tests, 100 per 15 min for production
  },
};

logger.info('CORS_ORIGIN loaded', {
  value: process.env.CORS_ORIGIN || config.cors.origin,
});

const postgresUrl = process.env.POSTGRES_ANALYTICS_URL;

if (!postgresUrl) {
  logger.debug(process.env.POSTGRES_ANALYTICS_URL!);
  throw new Error('POSTGRES_ANALYTICS_URL is not set');
}

try {
  new URL(postgresUrl);
} catch {
  logger.debug(postgresUrl);
  const redacted = postgresUrl
    .replace(/:[^:@/]*@/, ':***@')
    .replace(/\?.*$/, '');
  throw new Error(`POSTGRES_ANALYTICS_URL is invalid: ${redacted}`);
}

const pool = new Pool({ connectionString: postgresUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export default config;
