import {rateLimit} from 'express-rate-limit';
import config from '@config/index';

export const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting only for health checks
    return req.path === '/health' || req.path === '/';
  }
});
