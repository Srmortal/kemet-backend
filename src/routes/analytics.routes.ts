import { Router } from 'express';
import { 
  getAnalyticsMetricsController, 
  postAnalyticsEventController 
} from '../controllers/analytics.controller';
// import { authenticate } from '../middleware/auth.middleware'; // Uncomment if detailed metrics should be protected

const router = Router();

// POST /api/analytics/events - Log an event (usually public or protected by API key)
router.post('/events', postAnalyticsEventController);

// GET /api/analytics/metrics - Get aggregated metrics (Admin only typically)
router.get('/metrics', getAnalyticsMetricsController);

export default router;