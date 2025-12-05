import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config';
// Initialize Firebase Admin SDK (reads env or service account)
import './config/firebase';
import routes from './routes';
import firebaseAdminRoutes from './routes/firebase-admin.routes';
import firebaseRoutes from './routes/firebase.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);
// Explicit firebase-admin routes
app.use('/api/firebase-admin', firebaseAdminRoutes);
// Dedicated Firebase auth/test endpoints
app.use('/api/firebase', firebaseRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
