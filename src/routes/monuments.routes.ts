import { Router } from 'express';
import { MonumentsController } from '../controllers/monuments.controller';

const router = Router();
const monumentsController = new MonumentsController();

/**
 * Egyptian Monuments API Routes
 * Serves scraped data from egymonuments.com stored in Firestore
 */

// Get all monuments with pagination and filters
router.get('/', monumentsController.getAllMonuments);

// Get stats
router.get('/stats', monumentsController.getStats);

// Get categories
router.get('/categories', monumentsController.getCategories);

// Get tags
router.get('/tags', monumentsController.getTags);

// Get monument by URL
router.get('/by-url', monumentsController.getMonumentByUrl);

// Search monuments
router.post('/search', monumentsController.searchMonuments);

// Get monument by ID (must be last to avoid conflicts)
router.get('/:id', monumentsController.getMonumentById);

export default router;
