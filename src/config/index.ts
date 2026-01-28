import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

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

export default config;
